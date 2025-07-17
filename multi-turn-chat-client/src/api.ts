// api.ts
const BASE_URL = 'http://localhost:8000/v1';
const API_KEY = 'sk-test';

export async function createConversation(
  systemPrompt: string,
  projectId: number,
  name: string = '',
  model: string = ''
): Promise<string> {
  const body = {
    system_prompt: systemPrompt,
    project_id: projectId,
    name,
    model, // ✅ 始终传模型，即使是默认值
  };

  const res = await fetch(`${BASE_URL}/chat/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return data.conversation_id;
}

export async function deleteConversation(id: string): Promise<void> {
  await fetch(`${BASE_URL}/chat/conversations/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
}

export async function updateConversationProject(id: string, projectId: number): Promise<void> {
  await fetch(`${BASE_URL}/chat/conversations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ project_id: projectId }),
  });
}

export async function getGroupedConversations(): Promise<any> {
  const res = await fetch(`${BASE_URL}/chat/conversations/grouped`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  return await res.json();
}

export async function getProjects(): Promise<{ id: number; name: string }[]> {
  const res = await fetch(`${BASE_URL}/projects`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  return await res.json();
}

export async function getMessages(
  conversationId: string
): Promise<Array<{ role: string; content: string }>> {
  const res = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const data = await res.json();
  return data.messages;
}

export async function sendMessageStream(
  conversationId: string,
  content: string,
  model: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: any) => void
) {
  try {
    const res = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        role: 'user',
        content,
        model,
        stream: true,
      }),
    });

    if (!res.body || !res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';

      for (const part of parts) {
        if (part.startsWith('data:')) {
          const json = part.slice(5).trim();
          if (json === '[DONE]') {
            onDone();
            return;
          }

          try {
            const payload = JSON.parse(json);
            if (payload.content) onChunk(payload.content);
          } catch (err) {
            console.warn('解析 SSE 错误:', err, json);
          }
        }
      }
    }
    onDone();
  } catch (err) {
    onError(err);
  }
}

export async function getModels(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/models`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const data = await res.json();
  return data.data.map((m: any) => m.id);
}

// 添加以下两个方法 👇

export async function updateConversationName(id: string, newName: string): Promise<void> {
  await fetch(`${BASE_URL}/chat/conversations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ name: newName }),
  });
}

export async function updateConversationModel(id: string, model: string): Promise<void> {
  await fetch(`${BASE_URL}/chat/conversations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model }),
  });
}
