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
  // 预留更多字段（后端可能返回描述、owner等）
  [key: string]: any;
};