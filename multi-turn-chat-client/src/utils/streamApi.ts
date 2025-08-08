import { BASE_URL, API_KEY } from '../config';

export async function stopStreamApi(sessionId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/chat/stop-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || '停止流式生成失败');
  }
}