// useChatStream.ts
import { useState } from 'react';
import { sendMessageStream } from './api';
import { Message } from './types';
import { MAX_AUTO_CONTINUE_ROUNDS } from './config';

/**
 * 通用递归流式对话工具（可用于hook和非hook场景）
 */
export function createChatStream(
  conversationId: string,
  model: string,
  appendMessage: (msg: Message, replaceLast?: boolean) => void,
  setLoading?: (v: boolean) => void
) {
  // 自动递归 continue
  const send = async (input: string) => {
    if (!input.trim()) return;
    setLoading?.(true);

    // 用户消息
    appendMessage({ role: 'user', content: input, collapsed: false });

    let rounds = 0;

    // 内部递归: assistant流式回复
    const sendOne = async (prompt: string) => {
      let streamedReply = '';

      // 插入等待动画
      appendMessage(
        { role: 'assistant', content: '<span class="waiting-typing">正在思考……</span>', collapsed: false }
      );

      try {
        await sendMessageStream(
          conversationId,
          prompt,
          model,
          (chunk) => {
            streamedReply += chunk;
            appendMessage(
              { role: 'assistant', content: streamedReply, collapsed: false },
              true
            );
          },
          async () => {
            if (
              /\[to be continue\]\s*$/i.test(streamedReply) &&
              rounds < MAX_AUTO_CONTINUE_ROUNDS
            ) {
              rounds++;
              // 移除最后的 [to be continue]
              streamedReply = streamedReply.replace(/\s*\[to be continue\]\s*$/i, '').trim();
              appendMessage(
                { role: 'assistant', content: streamedReply, collapsed: false },
                true
              );
              // 继续递归
              await sendOne(
                "continue, and mark [to be continue] at the last line of your replay if your output is NOT over and wait user's command to be continued"
              );
            } else {
              setLoading?.(false);
            }
          },
          (err) => {
            setLoading?.(false);
            appendMessage(
              {
                role: 'system',
                content: '发送出错: ' + (err?.message || err),
                collapsed: false,
              },
              true
            );
          }
        );
      } catch (err) {
        setLoading?.(false);
        appendMessage(
          {
            role: 'system',
            content: '发送出错: ' + (err as any)?.message || String(err),
            collapsed: false,
          },
          true
        );
      }
    };

    await sendOne(input);
  };

  return { send };
}

/**
 * 原hook写法，内部注入 loading 状态
 */
export default function useChatStream(
  conversationId: string,
  model: string,
  appendMessage: (msg: Message, replaceLast?: boolean) => void
) {
  const [loading, setLoading] = useState(false);

  const { send } = createChatStream(conversationId, model, appendMessage, setLoading);

  return { send, loading };
}