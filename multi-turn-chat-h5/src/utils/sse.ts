import { EventSourcePolyfill } from 'event-source-polyfill';
import { API_URL, getAuthToken } from '../api/config';
import type { SSEMessage } from '../types';

export interface SSEOptions {
  onMessage: (data: SSEMessage) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export class SSEClient {
  private eventSource: EventSourcePolyfill | null = null;

  connect(endpoint: string, options: SSEOptions, needsAuth: boolean = true): void {
    const headers: Record<string, string> = {
      'Accept': 'text/event-stream',
    };

    if (needsAuth) {
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

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
  const queryParams = new URLSearchParams();
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        queryParams.append(key, JSON.stringify(value));
      } else {
        queryParams.append(key, String(value));
      }
    }
  });

  const endpoint = `/chat/conversations/${conversationId}/messages?${queryParams.toString()}`;
  
  fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify(data),
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
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
      const lines = chunk.split('\n\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            options.onComplete?.();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            options.onMessage(parsed);
          } catch (e) {
            console.error('Parse error:', e);
          }
        }
      }
    }
  }).catch((error) => {
    options.onError?.(error);
  });

  return client;
};