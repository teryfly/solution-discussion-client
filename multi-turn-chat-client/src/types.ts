// types.ts
export type Message = {
  role: string;
  content: string;
  collapsed?: boolean;
  id?: number; // 添加可选的消息ID字段
};
export type ConversationMeta = {
  id: string;
  name?: string;
  model: string;
  createdAt: string;
  projectId?: number;
  projectName?: string;
  assistanceRole?: string; 
};
export type PlanCategory = {
  id: number;
  name: string;
};
export type Project = {
  id: number;
  name: string;
  dev_environment?: string;
  grpc_server_address?: string;
  llm_model?: string;
  llm_url?: string;
  git_work_dir?: string;
  ai_work_dir?: string;
  created_time?: string;
  updated_time?: string;
  [key: string]: any;
};