// types.ts
export type Message = {
  role: string;
  content: string;
  collapsed?: boolean;
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