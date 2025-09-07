import { ConversationMeta, DocumentReference } from '../../types';

export interface LogEntry {
  id: string;
  message: string;
  type: string;
  timestamp: string;
  data?: any;
}

export interface KnowledgePanelProps {
  conversationId: string;
  currentMeta?: ConversationMeta;
  onRefresh?: () => void;
  executionLogs: LogEntry[];
  onClearLogs?: () => void;
  lastExecutionSummary?: any;
  autoUpdateCode: boolean;
  onAutoUpdateCodeChange: (checked: boolean) => void;
  onDocumentReferencesChange?: () => void;
}

export interface ReferenceLists {
  projectReferences: DocumentReference[];
  conversationReferences: DocumentReference[];
  loading: boolean;
}

export type RemoveHandler = (doc: DocumentReference, type: 'project' | 'conversation', e: React.MouseEvent) => void;

export interface KnowledgeHeaderProps {
  conversationId: string;
  currentMeta?: ConversationMeta;
  onQuickRemove: RemoveHandler;
  onOpenProjectModal: () => void;
  onOpenConversationModal: () => void;
  onOpenDocumentDetail: (doc: DocumentReference) => void;
  onAddDocument: () => void;
  references: ReferenceLists;
}

export interface LogsSectionProps {
  executionLogs: LogEntry[];
  autoUpdateCode: boolean;
  onAutoUpdateCodeChange: (checked: boolean) => void;
  onClearLogs?: () => void;
}