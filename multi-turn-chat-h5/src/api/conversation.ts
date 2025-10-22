import { apiClient } from './client';
import type { Conversation, Message } from '../types';

export const conversationApi = {
  createConversation: async (data: {
    system_prompt?: string;
    project_id: number;
    name?: string;
    model?: string;
    assistance_role?: string;
    status?: number;
  }): Promise<{ conversation_id: string }> => {
    return apiClient.post<{ conversation_id: string }>('/chat/conversations', data);
  },

  getConversations: async (params?: {
    project_id?: number;
    status?: number;
  }): Promise<Conversation[]> => {
    const query = new URLSearchParams();
    if (params?.project_id) query.append('project_id', params.project_id.toString());
    if (params?.status !== undefined) query.append('status', params.status.toString());
    const queryString = query.toString();
    return apiClient.get<Conversation[]>(
      `/chat/conversations${queryString ? `?${queryString}` : ''}`
    );
  },

  getMessages: async (conversationId: string): Promise<{
    conversation_id: string;
    messages: Message[];
  }> => {
    return apiClient.get<{ conversation_id: string; messages: Message[] }>(
      `/chat/conversations/${conversationId}/messages`
    );
  },

  updateConversation: async (
    conversationId: string,
    data: Partial<Conversation>
  ): Promise<{ message: string }> => {
    return apiClient.put<{ message: string }>(
      `/chat/conversations/${conversationId}`,
      data
    );
  },

  deleteConversation: async (conversationId: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(
      `/chat/conversations/${conversationId}`
    );
  },

  deleteMessages: async (messageIds: number[]): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/chat/messages/delete', {
      message_ids: messageIds,
    });
  },

  stopStream: async (sessionId: string): Promise<{ message: string; session_id: string }> => {
    return apiClient.post<{ message: string; session_id: string }>(
      '/chat/stop-stream',
      { session_id: sessionId }
    );
  },
};