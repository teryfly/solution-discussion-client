// useChatStream.ts
import { useState } from 'react';
import { sendMessageStream } from './api';
import { Message } from './types';
import { MAX_AUTO_CONTINUE_ROUNDS } from './config';

/**
 * 连续流式消息输出，并在结尾检测 [to be continue] 自动递归
 * 每轮 assistant 输出单独新开气泡，流式更新最后一条
 */
export default function useChatStream(
  conversationId: string,
  model: string,
  appendMessage: (msg: Message, replaceLast?: boolean) => void
) {
  const [loading, setLoading] = useState(false);

  // 外部调用：用户发送/继续
  const send = async (input: string) => {
    if (!input.trim() || loading) return;
    setLoading(true);

    // 用户消息
    appendMessage({ role: 'user', content: input, collapsed: false });

    let rounds = 0;

    // 内部递归: 每轮流式 assistant 输出
    const sendOne = async (prompt: string) => {
      let streamedReply = '';

      // 新开 assistant 气泡，内容为空
      appendMessage({ role: 'assistant', content: '', collapsed: false });

      try {
        await sendMessageStream(
          conversationId,
          prompt,
          model,
          (chunk) => {
            streamedReply += chunk;
            // 实时更新最后一个 assistant 气泡内容
            appendMessage(
              { role: 'assistant', content: streamedReply, collapsed: false },
              true // 替换最后一条
            );
          },
          async () => {
            // 收完本轮流式 assistant，判断是否自动 continue
            if (
              /\[to be continue\]\s*$/i.test(streamedReply) &&
              rounds < MAX_AUTO_CONTINUE_ROUNDS
            ) {
              rounds++;
              // 移除最后的 [to be continue]
              streamedReply = streamedReply.replace(/\s*\[to be continue\]\s*$/i, '').trim();
              // 最终内容再更新一次
              appendMessage(
                { role: 'assistant', content: streamedReply, collapsed: false },
                true
              );
              // 递归新 assistant 气泡，继续流式
              await sendOne(
                'continue, and mark [to be continue] at the last line of your replay if your output is NOT over and wait user\'s command to be continued'
              );
            } else {
              setLoading(false);
            }
          },
          (err) => {
            setLoading(false);
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
        setLoading(false);
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

    // 用户只出一条气泡，后续继续由递归自动新开 assistant 气泡
    await sendOne(input);
  };

  return { send, loading };
}