// api.ts
import { BASE_URL, API_KEY, WRITE_SOURCE_CODE_CONFIG } from './config';
import type { Project } from './types';

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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `创建会话失败: ${res.status}`);
  }
  const data = await res.json();
  return data.conversation_id;
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/chat/conversations/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `删除会话失败: ${res.status}`);
  }
}

export async function updateConversationProject(id: string, projectId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/chat/conversations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ project_id: projectId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `更新会话项目失败: ${res.status}`);
  }
}

export async function getGroupedConversations(): Promise<any> {
  const res = await fetch(`${BASE_URL}/chat/conversations/grouped`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `获取分组会话失败: ${res.status}`);
  }
  return await res.json();
}

export async function getProjects(): Promise<Project[]> {
  const res = await fetch(`${BASE_URL}/projects`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `获取项目列表失败: ${res.status}`);
  }
  const data = await res.json();
  return data || [];
}

export async function getProjectDetail(id: number): Promise<Project> {
  const res = await fetch(`${BASE_URL}/projects/${id}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `获取项目详情失败: ${res.status}`);
  }
  return await res.json();
}

export async function createProject(projectData: {
  name: string;
  dev_environment: string;
  grpc_server_address: string;
  llm_model?: string;
  llm_url?: string;
  git_work_dir?: string;
  ai_work_dir?: string;
}): Promise<Project> {
  const res = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      llm_model: 'GPT-4.1',
      llm_url: 'http://43.132.224.225:8000/v1/chat/completions',
      git_work_dir: '/git_workspace',
      ai_work_dir: '/aiWorkDir',
      ...projectData,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `创建项目失败: ${res.status}`);
  }
  return await res.json();
}

export async function updateProject(id: number, projectData: Partial<{
  name: string;
  dev_environment: string;
  grpc_server_address: string;
  llm_model: string;
  llm_url: string;
  git_work_dir: string;
  ai_work_dir: string;
}>): Promise<Project> {
  const res = await fetch(`${BASE_URL}/projects/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(projectData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `更新项目失败: ${res.status}`);
  }
  return await res.json();
}

export async function deleteProject(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `删除项目失败: ${res.status}`);
  }
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
): Promise<Array<{ id?: number; role: string; content: string }>> {
  const res = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `获取消息失败: ${res.status}`);
  }
  const data = await res.json();
  return data.messages;
}

export async function sendMessageStream(
  conversationId: string,
  content: string,
  model: string,
  documentIds: number[] = [], // 新增：文档ID数组
  onChunk: (text: string, metadata?: { user_message_id?: number; assistant_message_id?: number; conversation_id?: string; session_id?: string }) => void,
  onDone: () => void,
  onError: (err: any) => void
) {
  try {
    const requestBody: any = {
      role: 'user',
      content,
      model,
      stream: true,
    };

    // 如果有文档引用，添加到请求体中
    if (documentIds.length > 0) {
      requestBody.documents = documentIds;
    }

    const res = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(requestBody),
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
        if (!part.startsWith('data:')) continue;
        const json = part.slice(5).trim();
        if (json === '[DONE]') {
          onDone();
          return;
        }
        try {
          const payload = JSON.parse(json);
          if (isFirstMessage && (payload.user_message_id || payload.assistant_message_id)) {
            isFirstMessage = false;
            onChunk('', {
              user_message_id: payload.user_message_id,
              assistant_message_id: payload.assistant_message_id,
              conversation_id: payload.conversation_id,
              session_id: payload.session_id,
            });
          }
          if (payload.content) {
            onChunk(payload.content);
          }
        } catch (err) {
          console.warn('解析 SSE 错误:', err, json);
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `获取模型失败: ${res.status}`);
  }
  const data = await res.json();
  return data.data.map((m: any) => m.id);
}

export async function updateConversationName(id: string, newName: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/chat/conversations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ name: newName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `更新会话名称失败: ${res.status}`);
  }
}

export async function updateConversationModel(id: string, model: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/chat/conversations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `更新模型失败: ${res.status}`);
  }
}

// 计划分类API
export async function getPlanCategories(): Promise<{ id: number; name: string }[]> {
  const cache = localStorage.getItem('plan_categories');
  let categories: { id: number; name: string }[] = [];
  try {
    if (cache) {
      categories = JSON.parse(cache);
    }
  } catch (e) {}
  const res = await fetch(`${BASE_URL}/plan/categories`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `获取分类失败: ${res.status}`);
  }
  const data = await res.json();
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
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.detail || (err as any)?.message || '新建文档失败');
  }
  return await res.json();
}

export async function getCompleteSourceCode(projectId: number): Promise<string> {
  const res = await fetch(`${BASE_URL}/projects/${projectId}/complete-source-code`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `获取项目源码失败: ${res.status}`);
  }
  const data = await res.json();
  return data.completeSourceCode || '';
}

// 写入源码API
export async function writeSourceCode(
  rootDir: string,
  filesContent: string,
  onChunk: (data: { message: string; type: string; timestamp: string; data?: any }) => void,
  onDone: () => void,
  onError: (err: any) => void
): Promise<void> {
  try {
    const res = await fetch(`${BASE_URL}/write-source-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        root_dir: rootDir,
        files_content: filesContent,
        log_level: WRITE_SOURCE_CODE_CONFIG.log_level,
        backup_enabled: WRITE_SOURCE_CODE_CONFIG.backup_enabled,
      }),
    });
    if (!res.body || !res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            onDone();
            return;
          }
          try {
            const data = JSON.parse(jsonStr);
            onChunk(data);
          } catch (err) {
            console.warn('解析写入源码API响应错误:', err, jsonStr);
          }
        }
      }
    }
    onDone();
  } catch (err) {
    onError(err);
  }
}

// ==================== 知识库引用相关API ====================

// 查询会话引用的文档
export async function getConversationReferencedDocuments(conversationId: string): Promise<{
  conversation_id: string;
  project_references: any[];
  conversation_references: any[];
}> {
  const res = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/referenced-documents`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `获取会话引用文档失败: ${res.status}`);
  }
  return await res.json();
}

// 获取可引用的知识库文档列表
export async function getKnowledgeDocuments(projectId: number): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/plan/documents/history?project_id=${projectId}&category_id=5`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `获取知识库文档失败: ${res.status}`);
  }
  return await res.json();
}

// 查询项目级引用
export async function getProjectDocumentReferences(projectId: number): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/projects/${projectId}/document-references`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `获取项目引用失败: ${res.status}`);
  }
  return await res.json();
}

// 设置项目级引用
export async function setProjectDocumentReferences(projectId: number, documentIds: number[]): Promise<any> {
  const res = await fetch(`${BASE_URL}/projects/${projectId}/document-references`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ document_ids: documentIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `设置项目引用失败: ${res.status}`);
  }
  return await res.json();
}

// 清空项目级引用
export async function clearProjectDocumentReferences(projectId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/projects/${projectId}/document-references`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `清空项目引用失败: ${res.status}`);
  }
}

// 查询会话级引用
export async function getConversationDocumentReferences(conversationId: string): Promise<any[]> {
  const res = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/document-references`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `获取会话引用失败: ${res.status}`);
  }
  return await res.json();
}

// 设置会话级引用
export async function setConversationDocumentReferences(conversationId: string, documentIds: number[]): Promise<any> {
  const res = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/document-references`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ document_ids: documentIds }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `设置会话引用失败: ${res.status}`);
  }
  return await res.json();
}

// 清空会话级引用
export async function clearConversationDocumentReferences(conversationId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/document-references`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `清空会话引用失败: ${res.status}`);
  }
}

// 查看文档详情
export async function getDocumentDetail(documentId: number): Promise<any> {
  const res = await fetch(`${BASE_URL}/plan/documents/${documentId}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `获取文档详情失败: ${res.status}`);
  }
  return await res.json();
}

// 编辑文档内容
export async function updateDocument(documentId: number, data: {
  filename?: string;
  content?: string;
  source?: string;
}): Promise<any> {
  const res = await fetch(`${BASE_URL}/plan/documents/${documentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `更新文档失败: ${res.status}`);
  }
  return await res.json();
}

// 删除单个文档引用
export async function removeProjectDocumentReference(projectId: number, documentId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/projects/${projectId}/document-references/${documentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `删除项目引用失败: ${res.status}`);
  }
}

// 删除单个会话级文档引用
export async function removeConversationDocumentReference(conversationId: string, documentId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/chat/conversations/${conversationId}/document-references/${documentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `删除会话引用失败: ${res.status}`);
  }
}