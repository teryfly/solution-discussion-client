import { httpGet, httpJson } from './http';

export async function createConversation(
  systemPrompt: string,
  projectId: number,
  name: string = '',
  model: string = '',
  assistanceRole: string = ''
): Promise<string> {
  const data = await httpJson<{ conversation_id: string }>(
    `/chat/conversations`,
    'POST',
    {
      system_prompt: systemPrompt,
      project_id: projectId,
      name,
      model,
      assistance_role: assistanceRole,
    }
  );
  return data.conversation_id;
}

export async function deleteConversation(id: string): Promise<void> {
  await httpJson(`/chat/conversations/${id}`, 'DELETE');
}

export async function updateConversationProject(id: string, projectId: number): Promise<void> {
  await httpJson(`/chat/conversations/${id}`, 'PUT', { project_id: projectId });
}

export async function getGroupedConversations(): Promise<any> {
  return httpGet(`/chat/conversations/grouped`);
}

export async function getConversations(params: { project_id?: number; status?: number } = {}): Promise<any[]> {
  const qs = new URLSearchParams();
  if (typeof params.project_id === 'number') qs.set('project_id', String(params.project_id));
  if (typeof params.status === 'number') qs.set('status', String(params.status));
  const q = qs.toString() ? `?${qs.toString()}` : '';
  return httpGet(`/chat/conversations${q}`);
}

export async function getMessages(
  conversationId: string
): Promise<Array<{ id?: number; role: string; content: string }>> {
  const data = await httpGet<{ messages: Array<{ id?: number; role: string; content: string }> }>(
    `/chat/conversations/${conversationId}/messages`
  );
  return data.messages;
}

export async function updateConversationName(id: string, newName: string): Promise<void> {
  await httpJson(`/chat/conversations/${id}`, 'PUT', { name: newName });
}

export async function updateConversationModel(id: string, model: string): Promise<void> {
  await httpJson(`/chat/conversations/${id}`, 'PUT', { model });
}

export async function getConversationReferencedDocuments(conversationId: string): Promise<{
  conversation_id: string;
  project_references: any[];
  conversation_references: any[];
}> {
  return httpGet(`/chat/conversations/${conversationId}/referenced-documents`);
}