import { httpGet, httpJson } from './http';

export async function getPlanCategories(): Promise<{ id: number; name: string }[]> {
  const data = await httpGet<any[]>(`/plan/categories`);
  const clean = (data || []).map((item: any) => ({ id: item.id, name: item.name }));
  localStorage.setItem('plan_categories', JSON.stringify(clean));
  return clean;
}

export async function createPlanDocument(payload: {
  project_id: number;
  filename: string;
  category_id: number;
  content: string;
  version?: number;
  source?: string;
}): Promise<any> {
  return httpJson(`/plan/documents`, 'POST', {
    version: 1,
    source: 'user',
    ...payload,
  });
}

/**
 * 获取指定项目的全部知识库文档（不按分类过滤）
 * GET /v1/plan/documents/history?project_id={project_id}
 */
export async function getKnowledgeDocuments(projectId: number): Promise<any[]> {
  const data = await httpGet<any[]>(`/plan/documents/history?project_id=${projectId}`);
  return (data || []).sort((a, b) => b.id - a.id);
}

export async function getProjectDocumentReferences(projectId: number): Promise<any[]> {
  return httpGet(`/projects/${projectId}/document-references`);
}

export async function setProjectDocumentReferences(projectId: number, documentIds: number[]): Promise<any> {
  return httpJson(`/projects/${projectId}/document-references`, 'POST', { document_ids: documentIds });
}

export async function clearProjectDocumentReferences(projectId: number): Promise<void> {
  await httpJson(`/projects/${projectId}/document-references`, 'DELETE');
}

export async function getConversationDocumentReferences(conversationId: string): Promise<any[]> {
  return httpGet(`/chat/conversations/${conversationId}/document-references`);
}

export async function setConversationDocumentReferences(conversationId: string, documentIds: number[]): Promise<any> {
  return httpJson(`/chat/conversations/${conversationId}/document-references`, 'POST', { document_ids: documentIds });
}

export async function clearConversationDocumentReferences(conversationId: string): Promise<void> {
  await httpJson(`/chat/conversations/${conversationId}/document-references`, 'DELETE');
}

export async function getDocumentDetail(documentId: number): Promise<any> {
  return httpGet(`/plan/documents/${documentId}`);
}

export async function updateDocument(documentId: number, data: {
  filename?: string;
  content?: string;
  source?: string;
}): Promise<any> {
  return httpJson(`/plan/documents/${documentId}`, 'PUT', data);
}

/**
 * 获取分类详情（包含 prompt_template 和 summary_model）
 * GET /v1/plan/categories/{category_id}
 */
export async function getPlanCategoryDetail(categoryId: number): Promise<{
  id: number;
  name: string;
  prompt_template?: string;
  message_method?: string;
  auto_save_category_id?: number | null;
  is_builtin?: boolean;
  created_time?: string;
  summary_model?: string;
}> {
  return httpGet(`/plan/categories/${categoryId}`);
}