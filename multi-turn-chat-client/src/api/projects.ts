import { httpGet, httpJson } from './http';
import type { Project } from '../types';

export async function getProjects(): Promise<Project[]> {
  const data = await httpGet<Project[]>(`/projects`);
  return data || [];
}

export async function getProjectDetail(id: number): Promise<Project> {
  return httpGet<Project>(`/projects/${id}`);
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
  // passthrough body, server may provide defaults
  return httpJson<Project>(`/projects`, 'POST', projectData);
}

export async function updateProject(id: number, projectData: Partial<Project>): Promise<Project> {
  return httpJson<Project>(`/projects/${id}`, 'PUT', projectData);
}

export async function deleteProject(id: number): Promise<void> {
  await httpJson(`/projects/${id}`, 'DELETE');
}

export async function getModels(): Promise<string[]> {
  const data = await httpGet<{ data: { id: string }[] }>(`/models`);
  return (data.data || []).map((m) => m.id);
}

export async function getCompleteSourceCode(projectId: number): Promise<string> {
  const data = await httpGet<{ completeSourceCode?: string }>(`/projects/${projectId}/complete-source-code`);
  return data.completeSourceCode || '';
}