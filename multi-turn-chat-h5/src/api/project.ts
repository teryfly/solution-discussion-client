import { apiClient } from './client';
import type { Project, Model } from '../types';

export const projectApi = {
  getProjects: async (): Promise<Project[]> => {
    return apiClient.get<Project[]>('/projects');
  },

  getProject: async (id: number): Promise<Project> => {
    return apiClient.get<Project>(`/projects/${id}`);
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    return apiClient.post<Project>('/projects', data);
  },

  updateProject: async (id: number, data: Partial<Project>): Promise<Project> => {
    return apiClient.put<Project>(`/projects/${id}`, data);
  },

  deleteProject: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/projects/${id}`);
  },

  getCompleteSourceCode: async (id: number): Promise<{ completeSourceCode: string }> => {
    return apiClient.get<{ completeSourceCode: string }>(
      `/projects/${id}/complete-source-code`
    );
  },

  getModels: async (): Promise<{ data: Model[] }> => {
    return apiClient.get<{ data: Model[] }>('/models');
  },
};