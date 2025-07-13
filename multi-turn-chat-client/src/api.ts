// src/api.ts
import axios from 'axios';
import { EventSourcePolyfill } from 'event-source-polyfill';


const BASE_URL = 'http://xxxx:8000/v1/chat';
const API_KEY = 'sk-your-key-test'; // ← 替换成你的密钥

const instance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  },
});

export async function createConversation(systemPrompt: string): Promise<string> {
  const response = await instance.post('/conversations', { system_prompt: systemPrompt });
  return response.data.conversation_id;
}

export async function sendMessage(conversationId: string, content: string, model: string): Promise<string> {
  const response = await instance.post(`/conversations/${conversationId}/messages`, {
    role: 'user',
    content,
    model,
  });
  return response.data.reply;
}

export async function getMessages(conversationId: string): Promise<Array<{ role: string, content: string }>> {
  const response = await instance.get(`/conversations/${conversationId}/messages`);
  return response.data.messages;
}

export async function sendMessageStream(
  conversationId: string,
  content: string,
  model: string,
  onChunk: (token: string) => void,
  onDone: () => void,
  onError: (err: any) => void
) {
  try {
    const response = await fetch(`${BASE_URL}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'user',
        content,
        model,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`SSE 请求失败，状态码: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 最后一行可能是不完整的，保留

      for (let line of lines) {
        line = line.trim();
        if (!line.startsWith('data:')) continue;

        const data = line.slice(5).trim();
        if (data === '[DONE]') {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(data);
          if (parsed?.content) {
            onChunk(parsed.content);
          }
        } catch (err) {
          console.warn('解析 SSE 数据失败:', data);
        }
      }
    }
  } catch (err) {
    onError(err);
  }
}

