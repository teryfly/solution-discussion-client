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
  ai_work_dir?: string;      // 后端字段
  aiWorkDir?: string;        // 兼容可能的驼峰形式
  [key: string]: any;        // 预留更多字段（后端可能返回描述、owner等）
};