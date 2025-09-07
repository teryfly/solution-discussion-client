export type GenerateType = 'project' | 'agile' | '';

export interface AddDocumentModalProps {
  visible: boolean;
  projectId: number;
  onClose: () => void;
  onSuccess?: () => void;
  conversationId?: string;
  defaultCategoryId?: number; // 0 或 undefined 表示“请选择”
}

export interface FormData {
  filename: string;
  content: string;
  category_id: number; // 0 表示“请选择”
}

export interface GenerateState {
  generating: boolean;
  type: GenerateType;
}