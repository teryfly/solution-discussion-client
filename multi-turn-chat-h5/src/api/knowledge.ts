import { apiClient } from './client';
import type { Category, PlanDocument, DocumentReference } from '../types';

export const knowledgeApi = {
  getCategories: async (): Promise<Category[]> => {
    return apiClient.get<Category[]>('/plan/categories');
  },

  getDocuments: async (params: {
    project_id: number;
    category_id?: number;
    filename?: string;
  }): Promise<PlanDocument[]> => {
    const query = new URLSearchParams();
    query.append('project_id', params.project_id.toString());
    if (params.category_id) query.append('category_id', params.category_id.toString());
    if (params.filename) query.append('filename', params.filename);
    return apiClient.get<PlanDocument[]>(`/plan/documents/history?${query.toString()}`);
  },

  getDocument: async (documentId: number): Promise<PlanDocument> => {
    return apiClient.get<PlanDocument>(`/plan/documents/${documentId}`);
  },

  createDocument: async (data: {
    project_id: number;
    category_id: number;
    filename: string;
    content: string;
    version?: number;
    source?: 'user' | 'server' | 'chat';
    related_log_id?: number;
  }): Promise<PlanDocument> => {
    return apiClient.post<PlanDocument>('/plan/documents', data);
  },

  updateDocument: async (
    documentId: number,
    data: {
      filename?: string;
      content?: string;
      source?: 'user' | 'server' | 'chat';
    }
  ): Promise<PlanDocument> => {
    return apiClient.put<PlanDocument>(`/plan/documents/${documentId}`, data);
  },

  getProjectReferences: async (projectId: number): Promise<DocumentReference[]> => {
    return apiClient.get<DocumentReference[]>(
      `/projects/${projectId}/document-references`
    );
  },

  setProjectReferences: async (
    projectId: number,
    documentIds: number[]
  ): Promise<{
    message: string;
    added_count: number;
    removed_count: number;
    current_references: number[];
  }> => {
    return apiClient.post(`/projects/${projectId}/document-references`, {
      document_ids: documentIds,
    });
  },

  clearProjectReferences: async (projectId: number): Promise<{
    message: string;
    added_count: number;
    removed_count: number;
    current_references: number[];
  }> => {
    return apiClient.delete(`/projects/${projectId}/document-references`);
  },

  getConversationReferences: async (
    conversationId: string
  ): Promise<DocumentReference[]> => {
    return apiClient.get<DocumentReference[]>(
      `/chat/conversations/${conversationId}/document-references`
    );
  },

  setConversationReferences: async (
    conversationId: string,
    documentIds: number[]
  ): Promise<{
    message: string;
    added_count: number;
    removed_count: number;
    current_references: number[];
  }> => {
    return apiClient.post(`/chat/conversations/${conversationId}/document-references`, {
      document_ids: documentIds,
    });
  },

  clearConversationReferences: async (conversationId: string): Promise<{
    message: string;
    added_count: number;
    removed_count: number;
    current_references: number[];
  }> => {
    return apiClient.delete(`/chat/conversations/${conversationId}/document-references`);
  },

  getReferencedDocuments: async (conversationId: string): Promise<{
    conversation_id: string;
    project_references: DocumentReference[];
    conversation_references: DocumentReference[];
  }> => {
    return apiClient.get(
      `/chat/conversations/${conversationId}/referenced-documents`
    );
  },
};