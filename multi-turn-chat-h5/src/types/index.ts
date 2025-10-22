// Common Types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  detail?: string;
}

// User & Auth
export interface User {
  id: string;
  username: string;
  token: string;
}

// Project Types
export interface Project {
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
}

// Conversation Types
export interface Conversation {
  id: string;
  system_prompt?: string;
  status?: number;
  created_at: string;
  updated_at?: string;
  project_id?: number;
  name?: string;
  model?: string;
  assistance_role?: string;
}

// Message Types
export interface Message {
  id: number;
  conversation_id: string;
  role: 'system' | 'user' | 'assistant' | 'tool' | 'function';
  content: string;
  created_at?: string;
  updated_at?: string;
  collapsed?: boolean;
}

// Knowledge Types
export interface Category {
  id: number;
  name: string;
  prompt_template?: string;
  message_method?: string;
  auto_save_category_id?: number | null;
  is_builtin?: boolean;
  created_time?: string;
}

export interface PlanDocument {
  id: number;
  project_id: number;
  category_id: number;
  filename: string;
  content: string;
  version: number;
  source: 'user' | 'server' | 'chat';
  related_log_id?: number | null;
  created_time?: string | null;
}

export interface DocumentReference {
  id: number;
  project_id: number;
  conversation_id: string | null;
  document_id: number;
  reference_type: 'project' | 'conversation';
  document_filename: string;
  document_content: string;
  document_version: number;
  document_created_time: string;
}

// Log Types
export interface ExecutionLog {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'summary';
  message: string;
  timestamp: string;
  data?: any;
}

// SSE Types
export interface SSEMessage {
  user_message_id?: number | null;
  assistant_message_id?: number;
  conversation_id?: string;
  session_id?: string;
  content?: string;
  finish_reason?: string;
}

// Model Types
export interface Model {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
}