// useChatStream.ts
import React, { useState, useRef, useCallback } from 'react';
import { sendMessageStream, getReferencedDocumentsContent } from '../api';
import { Message } from '../types';
import { shouldAutoContinue } from '../utils/autoContinue';

// 线程管理器
class ConversationThreadManager {
  private threads = new Map<string, {
    isActive: boolean;
    abortController: AbortController;
    appendMessage: (msg: Message, replaceLast?: boolean) => void;
    setLoading: (loading: boolean) => void;
    getDocumentIds?: () => number[];
    onMessageComplete?: (content: string, charCount: number) => void;
  }>();

  createThread(
    conversationId: string, 
    appendMessage: (msg: Message, replaceLast?: boolean) => void,
    setLoading: (loading: boolean) => void,
    getDocumentIds?: () => number[],
    onMessageComplete?: (content: string, charCount: number) => void
  ) {
    if (this.threads.has(conversationId)) {
      this.stopThread(conversationId);
    }
    const abortController = new AbortController();
    this.threads.set(conversationId, {
      isActive: true,
      abortController,
      appendMessage,
      setLoading,
      getDocumentIds,
      onMessageComplete
    });
    return {
      send: this.createSender(conversationId),
      isActive: () => this.threads.get(conversationId)?.isActive || false
    };
  }

  stopThread(conversationId: string) {
    const thread = this.threads.get(conversationId);
    if (thread) {
      thread.isActive = false;
      thread.abortController.abort();
      thread.setLoading(false);
      this.threads.delete(conversationId);
    }
  }

  setActiveThread(conversationId: string) {
    this.threads.forEach((thread) => (thread.isActive = false));
    const thread = this.threads.get(conversationId);
    if (thread) thread.isActive = true;
  }

  isThreadActive(conversationId: string): boolean {
    return this.threads.get(conversationId)?.isActive || false;
  }

  private createSender(conversationId: string) {
    return async (input: string, model: string) => {
      const thread = this.threads.get(conversationId);
      if (!thread) return;

      if (!input.trim()) return;
      thread.setLoading(true);

      let rounds = 0;
      let userMessageId: number | undefined;
      let assistantMessageId: number | undefined;
      let hasShownThinking = false; // 是否已经显示动画
      let firstRealArrived = false; // 是否已收到首个真实内容
      let streamedReply = '';

      const sendOne = async (prompt: string) => {
        const currentThread = this.threads.get(conversationId);
        if (!currentThread || currentThread.abortController.signal.aborted) return;

        hasShownThinking = false;
        firstRealArrived = false;
        streamedReply = '';
        let isFirstChunk = true;

        if (currentThread.isActive) {
          // 1) 追加用户消息
          currentThread.appendMessage({ role: 'user', content: prompt, collapsed: false });
          // 2) 追加占位的 assistant（空内容，后续填充为动画或真实数据）
          currentThread.appendMessage({ role: 'assistant', content: '', collapsed: false });
        }

        try {
          const documentIds = currentThread.getDocumentIds ? currentThread.getDocumentIds() : [];
          // 预取知识库追加
          let knowledgeContent = '';
          try {
            knowledgeContent = await getReferencedDocumentsContent(conversationId);
          } catch (err) {
            console.warn('获取知识库内容失败:', err);
          }

          await sendMessageStream(
            conversationId,
            prompt,
            model,
            documentIds,
            knowledgeContent,
            (chunk, metadata) => {
              const t = this.threads.get(conversationId);
              if (!t || t.abortController.signal.aborted) return;

              // 首次返回metadata时，补全用户/助手机器消息的ID
              if (isFirstChunk && metadata) {
                isFirstChunk = false;
                if (metadata.user_message_id) userMessageId = metadata.user_message_id;
                if (metadata.assistant_message_id) assistantMessageId = metadata.assistant_message_id;
                if (t.isActive && userMessageId) {
                  t.appendMessage(
                    { role: 'user', content: prompt, collapsed: false, id: userMessageId },
                    false
                  );
                }
              }

              // sendMessageStream 的实现会首先回调一次 “思考中...” 动画 chunk
              if (typeof chunk === 'string') {
                // 如果是“思考中...”动画且尚未显示，则显示动画
                if (!firstRealArrived && !hasShownThinking && chunk.includes('waiting-typing')) {
                  hasShownThinking = true;
                  // 用动画覆盖占位assistant消息
                  t.isActive && t.appendMessage(
                    { role: 'assistant', content: chunk, collapsed: false, id: assistantMessageId },
                    true
                  );
                  return;
                }

                // 一旦接收到第一段真实内容：
                // - 需要隐藏动画（通过直接用真实内容覆盖最后一条assistant）
                // - 之后继续累计真实内容
                if (chunk && !chunk.includes('waiting-typing')) {
                  streamedReply += chunk;
                  firstRealArrived = true;
                  t.isActive && t.appendMessage(
                    { role: 'assistant', content: streamedReply, collapsed: false, id: assistantMessageId },
                    true
                  );
                }
              }
            },
            async () => {
              const t = this.threads.get(conversationId);
              if (!t || t.abortController.signal.aborted) return;

              const { shouldContinue, continueMessage } = shouldAutoContinue(streamedReply, rounds);
              if (shouldContinue) {
                rounds++;
                streamedReply = streamedReply.replace(/\s*\[to be continue\]\s*$/i, '').trim();
                t.isActive && t.appendMessage(
                  { role: 'assistant', content: streamedReply, collapsed: false, id: assistantMessageId },
                  true
                );
                await sendOne(continueMessage);
              } else {
                // 如果没有任何真实内容返回（例如极端错误情况下只显示了动画），在完成时清理动画
                if (!firstRealArrived) {
                  // 用空或提示文案覆盖，避免动画残留
                  t.isActive && t.appendMessage(
                    { role: 'assistant', content: '（暂无输出）', collapsed: false, id: assistantMessageId },
                    true
                  );
                } else {
                  t.isActive && t.appendMessage(
                    { role: 'assistant', content: streamedReply, collapsed: false, id: assistantMessageId },
                    true
                  );
                }
                t.setLoading(false);

                const finalCharCount = streamedReply.length;
                if (t.isActive && t.onMessageComplete && streamedReply.trim()) {
                  t.onMessageComplete(streamedReply, finalCharCount);
                }
              }
            },
            (error) => {
              const t = this.threads.get(conversationId);
              if (!t || t.abortController.signal.aborted) return;
              t.isActive && t.appendMessage(
                { role: 'assistant', content: '⚠️ 出现错误: ' + ((error as any)?.message || error), collapsed: false },
                true
              );
              t.setLoading(false);
            }
          );
        } catch (e) {
          const t = this.threads.get(conversationId);
          if (!t || t.abortController.signal.aborted) return;
          t.isActive && t.appendMessage(
            { role: 'assistant', content: '⚠️ 出现错误: ' + ((e as any)?.message || e), collapsed: false }
          );
          t.setLoading(false);
        }
      };

      await sendOne(input);
    };
  }

  cleanup() {
    this.threads.forEach((_, id) => this.stopThread(id));
  }
}

const threadManager = new ConversationThreadManager();

// 对外API
export function createChatStream(
  conversationId: string,
  model: string,
  appendMessage: (msg: Message, replaceLast?: boolean) => void,
  setLoading?: (v: boolean) => void,
  getDocumentIds?: () => number[],
  onMessageComplete?: (content: string, charCount: number) => void
) {
  const thread = threadManager.createThread(
    conversationId, 
    appendMessage, 
    setLoading || (() => {}),
    getDocumentIds,
    onMessageComplete
  );
  const send = async (input: string) => {
    await thread.send(input, model);
  };
  return { send };
}

export default function useChatStream(
  conversationId: string,
  model: string,
  appendMessage: (msg: Message, replaceLast?: boolean) => void,
  getDocumentIds?: () => number[],
  onMessageComplete?: (content: string, charCount: number) => void
) {
  const [loading, setLoading] = useState(false);
  const threadRef = useRef<ReturnType<typeof threadManager.createThread> | null>(null);

  const initializeThread = useCallback(() => {
    if (conversationId) {
      threadRef.current = threadManager.createThread(
        conversationId, 
        appendMessage, 
        setLoading, 
        getDocumentIds,
        onMessageComplete
      );
      threadManager.setActiveThread(conversationId);
    }
  }, [conversationId, appendMessage, getDocumentIds, onMessageComplete]);

  const setActiveConversation = useCallback(() => {
    if (conversationId) {
      threadManager.setActiveThread(conversationId);
    }
  }, [conversationId]);

  const send = useCallback(async (input: string) => {
    if (!threadRef.current) initializeThread();
    if (threadRef.current) await threadRef.current.send(input, model);
  }, [model, initializeThread]);

  const stopThread = useCallback(() => {
    if (conversationId) {
      threadManager.stopThread(conversationId);
      setLoading(false);
    }
  }, [conversationId]);

  React.useEffect(() => {
    initializeThread();
    return () => {};
  }, [initializeThread]);

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

export { threadManager };