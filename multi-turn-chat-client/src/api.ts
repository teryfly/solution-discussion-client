// api.ts
import { BASE_URL, API_KEY } from './config'; // ✅ 使用统一配置
export async function createConversation(
  systemPrompt: string,
  projectId: number,
  name: string = '',
  model: string = '',
  assistanceRole: string = ''
): Promise<string> {
  const body = {
    system_prompt: systemPrompt,
    project_id: projectId,
    name,
    model,
    assistance_role: assistanceRole, 
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
export async function getConversations(params: { project_id?: number; status?: number } = {}): Promise<any[]> {
  const qs = new URLSearchParams();
  if (typeof params.project_id === 'number') qs.set('project_id', String(params.project_id));
  if (typeof params.status === 'number') qs.set('status', String(params.status));
  const url = `${BASE_URL}/chat/conversations${qs.toString() ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `获取会话失败: ${res.status}`);
  }
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
  onChunk: (text: string, metadata?: { user_message_id?: number; assistant_message_id?: number; conversation_id?: string }) => void,
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
    let isFirstMessage = true;
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
            // 第一条消息包含ID信息
            if (isFirstMessage && (payload.user_message_id || payload.assistant_message_id)) {
              isFirstMessage = false;
              onChunk('', {
                user_message_id: payload.user_message_id,
                assistant_message_id: payload.assistant_message_id,
                conversation_id: payload.conversation_id
              });
            }
            // 后续消息包含内容
            if (payload.content) {
              onChunk(payload.content);
            }
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
// 计划分类API
export async function getPlanCategories(): Promise<{ id: number; name: string }[]> {
  // 先查 localStorage
  const cache = localStorage.getItem('plan_categories');
  let categories: { id: number; name: string }[] = [];
  try {
    if (cache) {
      categories = JSON.parse(cache);
    }
  } catch (e) {}
  // 请求服务端
  const res = await fetch(`${BASE_URL}/plan/categories`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const data = await res.json();
  // 只取 id 和 name 存储
  const cleanData = (data || []).map((item: any) => ({
    id: item.id,
    name: item.name,
  }));
  localStorage.setItem('plan_categories', JSON.stringify(cleanData));
  return cleanData;
}
// 新建计划文档
export async function createPlanDocument({
  project_id,
  filename,
  category_id,
  content,
  version = 1,
  source = 'chat',
}: {
  project_id: number;
  filename: string;
  category_id: number;
  content: string;
  version?: number;
  source?: string;
}): Promise<any> {
  const res = await fetch(`${BASE_URL}/plan/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      project_id,
      filename,
      category_id,
      content,
      version,
      source,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || '新建文档失败');
  }
  return await res.json();
}
export async function getCompleteSourceCode(projectId: number): Promise<string> {
  const res = await fetch(`${BASE_URL}/projects/${projectId}/complete-source-code`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const data = await res.json();
  return data.completeSourceCode || '';
}