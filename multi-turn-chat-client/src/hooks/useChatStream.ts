// useChatStream.ts
import React, { useState, useRef, useCallback } from 'react';
import { sendMessageStream } from '../api';
import { Message } from '../types';
import { MAX_AUTO_CONTINUE_ROUNDS } from '../config';

/**
 * 检查是否需要自动继续
 * - 包含 [to be continue] 结尾（不区分大小写）
 * - 或者：存在某个 Step [X/Y] 且 X < Y，并且该 Y 没有对应的 Step [Y/Y]（即流程未真正完成）
 */
function shouldAutoContinue(text: string, rounds: number): boolean {
  if (rounds >= MAX_AUTO_CONTINUE_ROUNDS) return false;

  // 如果明确以 [to be continue] 结尾，优先继续
  if (/\[to be continue\]\s*$/i.test(text)) {
    return true;
  }

  // 解析所有 Step [X/Y]
  const stepMatches = [...text.matchAll(/Step\s*\[\s*(\d+)\s*\/\s*(\d+)\s*\]/gi)];
  if (stepMatches.length === 0) return false;

  // 统计每个 Y 是否有 X<Y （未完成）以及是否有 X==Y（完成终步）
  type StepInfo = { hasIncomplete: boolean; hasFinal: boolean };
  const map = new Map<number, StepInfo>();

  for (const match of stepMatches) {
    const x = parseInt(match[1], 10);
    const y = parseInt(match[2], 10);
    if (!map.has(y)) {
      map.set(y, { hasIncomplete: false, hasFinal: false });
    }
    const info = map.get(y)!;
    if (x < y) {
      info.hasIncomplete = true;
    } else if (x === y) {
      info.hasFinal = true;
    }
    // ignore x > y as malformed
  }

  // 如果存在某个 total Y，之前有未完成的 step 且没有 final 完成标记，就继续
  for (const [, info] of map) {
    if (info.hasIncomplete && !info.hasFinal) {
      return true;
    }
  }

  return false;
}

// 全局线程管理器
class ConversationThreadManager {
  private threads = new Map<string, {
    isActive: boolean;
    abortController: AbortController;
    appendMessage: (msg: Message, replaceLast?: boolean) => void;
    setLoading: (loading: boolean) => void;
  }>();

  // 创建或获取线程
  createThread(
    conversationId: string, 
    appendMessage: (msg: Message, replaceLast?: boolean) => void,
    setLoading: (loading: boolean) => void
  ) {
    // 如果线程已存在，先停止它
    if (this.threads.has(conversationId)) {
      this.stopThread(conversationId);
    }

    const abortController = new AbortController();
    this.threads.set(conversationId, {
      isActive: true,
      abortController,
      appendMessage,
      setLoading
    });

    return {
      send: this.createSender(conversationId),
      isActive: () => this.threads.get(conversationId)?.isActive || false
    };
  }

  // 停止指定线程
  stopThread(conversationId: string) {
    const thread = this.threads.get(conversationId);
    if (thread) {
      thread.isActive = false;
      thread.abortController.abort();
      thread.setLoading(false);
      this.threads.delete(conversationId);
    }
  }

  // 设置线程为活跃状态（当前显示的会话）
  setActiveThread(conversationId: string) {
    // 将所有线程设为非活跃
    this.threads.forEach((thread) => {
      thread.isActive = false;
    });
    
    // 设置当前线程为活跃
    const thread = this.threads.get(conversationId);
    if (thread) {
      thread.isActive = true;
    }
  }

  // 检查线程是否活跃
  isThreadActive(conversationId: string): boolean {
    return this.threads.get(conversationId)?.isActive || false;
  }

  // 创建发送器
  private createSender(conversationId: string) {
    return async (input: string, model: string) => {
      const thread = this.threads.get(conversationId);
      if (!thread) return;

      if (!input.trim()) return;
      thread.setLoading(true);

      let rounds = 0;
      let userMessageId: number | undefined;
      let assistantMessageId: number | undefined;

      // 内部递归: assistant流式回复
      const sendOne = async (prompt: string) => {
        const currentThread = this.threads.get(conversationId);
        if (!currentThread || currentThread.abortController.signal.aborted) {
          return;
        }

        let streamedReply = '';
        let isFirstChunk = true;

        // 只有活跃线程才显示用户消息和等待动画
        if (currentThread.isActive) {
          currentThread.appendMessage({ role: 'user', content: prompt, collapsed: false });
          currentThread.appendMessage(
            { role: 'assistant', content: '<span class="waiting-typing">正在思考……</span>', collapsed: false }
          );
        }

        try {
          await sendMessageStream(
            conversationId,
            prompt,
            model,
            (chunk, metadata) => {
              const thread = this.threads.get(conversationId);
              if (!thread || thread.abortController.signal.aborted) return;

              // 第一个chunk时处理消息ID
              if (isFirstChunk && metadata) {
                isFirstChunk = false;
                
                if (metadata.user_message_id) {
                  userMessageId = metadata.user_message_id;
                }
                if (metadata.assistant_message_id) {
                  assistantMessageId = metadata.assistant_message_id;
                }

                // 只有活跃线程才更新用户消息ID
                if (thread.isActive && userMessageId) {
                  thread.appendMessage(
                    { role: 'user', content: prompt, collapsed: false, id: userMessageId },
                    false
                  );
                }
              }

              // 处理内容chunk
              if (chunk) {
                streamedReply += chunk;
                // 只有活跃线程才显示实时消息
                if (thread.isActive) {
                  thread.appendMessage(
                    { 
                      role: 'assistant', 
                      content: streamedReply, 
                      collapsed: false,
                      id: assistantMessageId 
                    },
                    true
                  );
                }
              }
            },
            async () => {
              const thread = this.threads.get(conversationId);
              if (!thread || thread.abortController.signal.aborted) return;

              if (shouldAutoContinue(streamedReply, rounds)) {
                rounds++;
                streamedReply = streamedReply.replace(/\s*\[to be continue\]\s*$/i, '').trim();
                if (thread.isActive) {
                  thread.appendMessage(
                    { 
                      role: 'assistant', 
                      content: streamedReply, 
                      collapsed: false,
                      id: assistantMessageId 
                    },
                    true
                  );
                }
                await sendOne('go on');
              } else {
                if (thread.isActive) {
                  thread.appendMessage(
                    { 
                      role: 'assistant', 
                      content: streamedReply, 
                      collapsed: false,
                      id: assistantMessageId 
                    },
                    true
                  );
                }
                thread.setLoading(false);
                // 消息完成后不删除线程，保持线程状态
              }
            },
            (error) => {
              const thread = this.threads.get(conversationId);
              if (!thread || thread.abortController.signal.aborted) return;

              if (thread.isActive) {
                thread.appendMessage(
                  { role: 'assistant', content: '⚠️ 出现错误: ' + ((error as any)?.message || error), collapsed: false }
                );
              }
              thread.setLoading(false);
            }
          );
        } catch (e) {
          const thread = this.threads.get(conversationId);
          if (!thread || thread.abortController.signal.aborted) return;

          if (thread.isActive) {
            thread.appendMessage(
              { role: 'assistant', content: '⚠️ 出现错误: ' + ((e as any)?.message || e), collapsed: false }
            );
          }
          thread.setLoading(false);
        }
      };

      await sendOne(input);
    };
  }

  // 清理所有线程
  cleanup() {
    this.threads.forEach((thread, conversationId) => {
      this.stopThread(conversationId);
    });
  }
}

// 全局单例
const threadManager = new ConversationThreadManager();

/**
 * 通用递归流式对话工具（可用于hook和非hook场景）
 */
export function createChatStream(
  conversationId: string,
  model: string,
  appendMessage: (msg: Message, replaceLast?: boolean) => void,
  setLoading?: (v: boolean) => void
) {
  const thread = threadManager.createThread(
    conversationId, 
    appendMessage, 
    setLoading || (() => {})
  );

  const send = async (input: string) => {
    await thread.send(input, model);
  };

  return { send };
}

/**
 * React hook 封装
 */
export default function useChatStream(
  conversationId: string,
  model: string,
  appendMessage: (msg: Message, replaceLast?: boolean) => void
) {
  const [loading, setLoading] = useState(false);
  const threadRef = useRef<ReturnType<typeof threadManager.createThread> | null>(null);

  // 当会话ID变化时，创建新线程并设为活跃
  const initializeThread = useCallback(() => {
    if (conversationId) {
      threadRef.current = threadManager.createThread(conversationId, appendMessage, setLoading);
      threadManager.setActiveThread(conversationId);
    }
  }, [conversationId, appendMessage]);

  // 设置当前会话为活跃状态
  const setActiveConversation = useCallback(() => {
    if (conversationId) {
      threadManager.setActiveThread(conversationId);
    }
  }, [conversationId]);

  // 发送消息
  const send = useCallback(async (input: string) => {
    if (!threadRef.current) {
      initializeThread();
    }
    if (threadRef.current) {
      await threadRef.current.send(input, model);
    }
  }, [model, initializeThread]);

  // 停止当前线程
  const stopThread = useCallback(() => {
    if (conversationId) {
      threadManager.stopThread(conversationId);
      setLoading(false);
    }
  }, [conversationId]);

  // 初始化线程
  React.useEffect(() => {
    initializeThread();
    return () => {
      // 组件卸载时不停止线程，让它在后台继续运行
    };
  }, [initializeThread]);

  // 当切换到此会话时，设为活跃状态
  React.useEffect(() => {
    setActiveConversation();
  }, [setActiveConversation]);

  return { 
    send, 
    loading, 
    stopThread,
    setActiveConversation,
    isActive: () => threadManager.isThreadActive(conversationId)
  };
}

// 导出线程管理器供其他组件使用
export { threadManager };