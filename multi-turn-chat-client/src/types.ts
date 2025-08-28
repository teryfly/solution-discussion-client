// types.ts
export type Message = {
  role: string;
  content: string;
  collapsed?: boolean;
  id?: number; // 添加可选的消息ID字段
  updated_at?: string; // 新增：消息更新时间（ISO字符串）
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

// 知识库文档类型
export type KnowledgeDocument = {
  id: number;
  project_id: number;
  category_id: number;
  filename: string;
  content: string;
  version: number;
  source: string;
  related_log_id?: number;
  created_time: string;
};

// 文档引用类型
export type DocumentReference = {
  id: number;
  project_id: number;
  conversation_id?: string;
  document_id: number;
  reference_type: 'project' | 'conversation';
  document_filename: string;
  document_content: string;
  document_version: number;
  document_created_time: string;
};

// 会话引用的文档响应类型
export type ConversationReferencedDocuments = {
  conversation_id: string;
  project_references: DocumentReference[];
  conversation_references: DocumentReference[];
};