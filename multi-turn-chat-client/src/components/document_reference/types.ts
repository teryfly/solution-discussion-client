import { KnowledgeDocument } from '../../types';

export type RefType = 'project' | 'conversation';

export interface DocumentReferenceModalProps {
  visible: boolean;
  type: RefType;
  projectId: number;
  conversationId?: string;
  onClose: () => void;
  onUpdate?: () => void;
}

export interface TabsState {
  categories: Array<{ id: number; name: string }>;
  active: number | 'all';
}

export interface RefLists {
  availableDocuments: KnowledgeDocument[];
  currentReferences: number[];
  projectReferencedIds: number[];
}