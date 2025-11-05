import { EventSourcePolyfill } from 'event-source-polyfill';
import { API_URL } from '../api/config';
import type { SSEMessage } from '../types';

export interface SSEOptions {
  onMessage: (data: SSEMessage) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export class SSEClient {
  private eventSource: EventSourcePolyfill | null = null;

  connect(endpoint: string, options: SSEOptions, needsAuth: boolean = false): void {
    const headers: Record<string, string> = {
      'Accept': 'text/event-stream',
    };

    // 不需要 token 认证

    this.eventSource = new EventSourcePolyfill(`${API_URL}${endpoint}`, {
      headers,
      heartbeatTimeout: 120000,
    });

    this.eventSource.onmessage = (event) => {
      try {
        if (event.data === '[DONE]') {
          options.onComplete?.();
          this.close();
          return;
        }

        const data = JSON.parse(event.data);
        options.onMessage(data);
      } catch (error) {
        console.error('SSE parse error:', error);
        options.onError?.(error as Error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      options.onError?.(new Error('SSE连接错误'));
      this.close();
    };
  }

  close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

export const sendMessageStream = (
  conversationId: string,
  data: {
    role: string;
    content: string;
    model?: string;
    stream?: boolean;
    documents?: number[];
    system_prompt_append?: string;
  },
  options: SSEOptions
): SSEClient => {
  const client = new SSEClient();

  // 构建请求体
  const requestBody = {
    role: data.role,
    content: data.content,
    model: data.model || 'ChatGPT-4o-Latest',
    stream: data.stream !== false,
    ...(data.documents && { documents: data.documents }),
    ...(data.system_prompt_append && { system_prompt_append: data.system_prompt_append }),
  };

  const endpoint = `/chat/conversations/${conversationId}/messages`;

  fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify(requestBody),
  }).then(async (response) => {
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      let errorMessage = `HTTP ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      if (response.status === 401) {
        errorMessage = '认证失败，请重新登录';
      }

      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('无法读取响应流');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        options.onComplete?.();
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            options.onComplete?.();
            return;
          }
          if (data) {
            try {
              const parsed = JSON.parse(data);
              options.onMessage(parsed);
            } catch (e) {
              console.error('Parse error:', e, 'Data:', data);
            }
          }
        }
      }
    }
  }).catch((error) => {
    console.error('Stream request failed:', error);
    options.onError?.(error);
  });

  return client;
};