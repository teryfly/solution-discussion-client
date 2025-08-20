import { Message } from '../types';
import { sendMessageStream } from '../api';
import { shouldAutoContinue } from '../utils/autoContinue';
import { stopStreamApi } from '../utils/streamApi';
export interface ThreadInfo {
  isActive: boolean;
  abortController: AbortController;
  appendMessage: (msg: Message, replaceLast?: boolean) => void;
  setLoading: (loading: boolean) => void;
  sessionId?: string;
  stopStream: (() => Promise<void>) | null;
}
export interface ThreadController {
  send: (input: string, model: string) => Promise<void>;
  isActive: () => boolean;
  getSessionId: () => string | undefined;
  setSessionId: (id: string) => void;
  stopStream: () => Promise<void>;
}
export class ConversationThreadManager {
  private threads = new Map<string, ThreadInfo>();
  // 创建或获取线程
  createThread(
    conversationId: string, 
    appendMessage: (msg: Message, replaceLast?: boolean) => void,
    setLoading: (loading: boolean) => void
  ): ThreadController {
    // 如果线程已存在，先停止它
    if (this.threads.has(conversationId)) {
      this.stopThread(conversationId);
    }
    const abortController = new AbortController();
    this.threads.set(conversationId, {
      isActive: true,
      abortController,
      appendMessage,
      setLoading,
      sessionId: undefined,
      stopStream: null,
    });
    return {
      send: this.createSender(conversationId),
      isActive: () => this.threads.get(conversationId)?.isActive || false,
      getSessionId: () => this.threads.get(conversationId)?.sessionId,
      setSessionId: (id: string) => {
        const t = this.threads.get(conversationId);
        if (t) t.sessionId = id;
      },
      stopStream: async () => {
        const t = this.threads.get(conversationId);
        if (t && t.sessionId) {
          await stopStreamApi(t.sessionId);
        }
      },
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
      let sessionId: string | undefined;
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
                if (metadata.session_id) {
                  sessionId = metadata.session_id;
                  thread.sessionId = sessionId;
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
              const { shouldContinue, continueMessage } = shouldAutoContinue(streamedReply, rounds);
              if (shouldContinue) {
                rounds++;
                // 移除末尾 [to be continue]（如果有）
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
                await sendOne(continueMessage);
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