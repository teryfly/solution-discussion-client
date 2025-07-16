// useChatStream.ts
import { useState } from 'react';
import { sendMessageStream } from './api'; // 👈 只保留 sendMessageStream
import { Message } from './types';

export default function useChatStream(
  conversationId: string,
  model: string,
  appendMessage: (msg: Message, replaceLast?: boolean) => void
) {
  const [loading, setLoading] = useState(false);

  const send = async (input: string) => {
    if (!input.trim() || loading) return;
    setLoading(true);

    appendMessage({ role: 'user', content: input, collapsed: false });
    appendMessage({ role: 'assistant', content: '', collapsed: false });

    let streamedReply = '';

    await sendMessageStream(
      conversationId,
      input,
      model,
      (chunk) => {
        streamedReply += chunk;
        appendMessage({
          role: 'assistant',
          content: streamedReply,
          collapsed: false,
        }, true);
      },
      async () => {
        setLoading(false);
        // 👇 不再保存助手消息，避免重复
      },
      (err) => {
        setLoading(false);
        appendMessage({
          role: 'system',
          content: '发送出错: ' + (err?.message || err),
          collapsed: false,
        }, true);
      }
    );
  };

  return { send, loading };
}