// src/hooks/useThreadedChatManager.ts
import { useRef } from 'react';
import { Message } from '../types';
import { sendMessageStream } from '../api';
import { MAX_AUTO_CONTINUE_ROUNDS } from '../config';

type ThreadStatus = 'idle' | 'running' | 'done' | 'error';

export interface ChatThread {
  threadId: string; // 通常为 conversationId + "_" + timestamp
  conversationId: string;
  userMessage: string;
  model: string;
  status: ThreadStatus;
  rounds: number;
  assistantMessageId?: number;
  userMessageId?: number;
  streamedReply: string;
  appendMessage: (msg: Message, replaceLast?: boolean) => void;
  onFinish?: () => void;
  stop: () => void;
}

function shouldAutoContinue(text: string, rounds: number): boolean {
  if (rounds >= MAX_AUTO_CONTINUE_ROUNDS) return false;
  if (/\[to be continue\]\s*$/i.test(text)) return true;
  const stepMatches = [...text.matchAll(/Step\s*\[\s*(\d+)\s*\/\s*(\d+)\s*\]/gi)];
  if (stepMatches.length === 0) return false;
  type StepInfo = { hasIncomplete: boolean; hasFinal: boolean };
  const map = new Map<number, StepInfo>();
  for (const match of stepMatches) {
    const x = parseInt(match[1], 10);
    const y = parseInt(match[2], 10);
    if (!map.has(y)) map.set(y, { hasIncomplete: false, hasFinal: false });
    const info = map.get(y)!;
    if (x < y) info.hasIncomplete = true;
    else if (x === y) info.hasFinal = true;
  }
  for (const [, info] of map) {
    if (info.hasIncomplete && !info.hasFinal) return true;
  }
  return false;
}

// 全局管理所有会话的 active 线程池（非hook，单例）
export class ThreadedChatManager {
  threads: Record<string, ChatThread[]> = {}; // conversationId => [threads]
  listeners: Record<string, (() => void)[]> = {}; // conversationId => listeners

  // 新建线程并启动流式接收
  createThread(
    conversationId: string,
    userMessage: string,
    model: string,
    appendMessage: (msg: Message, replaceLast?: boolean) => void,
    onFinish?: () => void
  ): ChatThread {
    const threadId = `${conversationId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    let stopped = false;
    let rounds = 0;
    let streamedReply = '';
    let assistantMessageId: number | undefined;
    let userMessageId: number | undefined;
    let status: ThreadStatus = 'running';

    const stop = () => { stopped = true; };

    const thread: ChatThread = {
      threadId,
      conversationId,
      userMessage,
      model,
      status,
      streamedReply,
      appendMessage,
      onFinish,
      rounds,
      stop,
    };

    // 注册线程
    if (!this.threads[conversationId]) this.threads[conversationId] = [];
    this.threads[conversationId].push(thread);

    const notify = () => {
      (this.listeners[conversationId] || []).forEach(fn => fn());
    };

    // 内部递归流式发送
    const sendOne = async (content: string) => {
      appendMessage({ role: 'user', content, collapsed: false });
      appendMessage({ role: 'assistant', content: '<span class="waiting-typing">正在思考……</span>', collapsed: false });
      try {
        await sendMessageStream(
          conversationId,
          content,
          model,
          (chunk, metadata) => {
            if (stopped) return;
            // 第一个chunk处理metadata
            if (streamedReply.length === 0 && metadata) {
              if (metadata.user_message_id) userMessageId = metadata.user_message_id;
              if (metadata.assistant_message_id) assistantMessageId = metadata.assistant_message_id;
              if (userMessageId) appendMessage(
                { role: 'user', content, collapsed: false, id: userMessageId },
                false
              );
            }
            if (chunk) {
              streamedReply += chunk;
              appendMessage(
                { role: 'assistant', content: streamedReply, collapsed: false, id: assistantMessageId },
                true
              );
            }
          },
          async () => {
            if (stopped) return;
            if (shouldAutoContinue(streamedReply, rounds)) {
              rounds++;
              streamedReply = streamedReply.replace(/\s*\[to be continue\]\s*$/i, '').trim();
              appendMessage(
                { role: 'assistant', content: streamedReply, collapsed: false, id: assistantMessageId },
                true
              );
              await sendOne('go on');
            } else {
              status = 'done';
              thread.status = 'done';
              appendMessage(
                { role: 'assistant', content: streamedReply, collapsed: false, id: assistantMessageId },
                true
              );
              notify();
              onFinish?.();
            }
          },
          (err) => {
            if (stopped) return;
            status = 'error';
            thread.status = 'error';
            appendMessage(
              { role: 'assistant', content: '⚠️ 出现错误: ' + ((err as any)?.message || err), collapsed: false },
              true
            );
            notify();
            onFinish?.();
          }
        );
      } catch (e) {
        status = 'error';
        thread.status = 'error';
        appendMessage(
          { role: 'assistant', content: '⚠️ 出现错误: ' + ((e as any)?.message || e), collapsed: false }
        );
        notify();
        onFinish?.();
      }
    };
    sendOne(userMessage);
    return thread;
  }

  // 获取指定会话的所有线程
  getThreads(conversationId: string): ChatThread[] {
    return this.threads[conversationId] || [];
  }

  // 终止某个会话的所有线程
  stopAllThreads(conversationId: string) {
    (this.threads[conversationId] || []).forEach(t => t.stop());
  }

  // 注册监听器
  subscribe(conversationId: string, fn: () => void) {
    if (!this.listeners[conversationId]) this.listeners[conversationId] = [];
    this.listeners[conversationId].push(fn);
    return () => {
      this.listeners[conversationId] = (this.listeners[conversationId] || []).filter(cb => cb !== fn);
    };
  }
}

let globalManager: ThreadedChatManager | null = null;
export function getThreadedChatManager() {
  if (!globalManager) globalManager = new ThreadedChatManager();
  return globalManager;
}

// React Hook: 暴露指定会话的线程列表和创建/终止操作
export function useThreadedChatManager(conversationId: string) {
  const manager = useRef(getThreadedChatManager()).current;
  const [, forceUpdate] = useRef({}).current as [any, any];

  // 监听会话线程变化（仅用于强制刷新UI，可选）
  React.useEffect(() => {
    const unsubscribe = manager.subscribe(conversationId, () => forceUpdate({}));
    return unsubscribe;
    // eslint-disable-next-line
  }, [conversationId]);

  return {
    threads: manager.getThreads(conversationId),
    createThread: manager.createThread.bind(manager),
    stopAllThreads: manager.stopAllThreads.bind(manager),
    manager,
  };
}