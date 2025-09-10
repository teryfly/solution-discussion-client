import { DocumentReference } from '../../types';

export interface DocumentDetailModalProps {
  visible: boolean;
  document: DocumentReference;
  onClose: () => void;
  onUpdate?: () => void;
  onDocumentChange?: (newDocumentId: number) => void;
}

export interface DocumentDetailState {
  loading: boolean;
  saving: boolean;
  documentDetail: any;
  editMode: boolean;
  filename: string;
  content: string;
  currentDocumentId: number;
}

export interface DocumentViewerProps {
  content: string;
  filename: string;
  loading: boolean;
  editMode: boolean;
  saving: boolean;
  onContentChange: (content: string) => void;
  lineColRef: React.RefObject<HTMLDivElement>;
  contentColRef: React.RefObject<HTMLDivElement>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export interface DocumentHeaderProps {
  editMode: boolean;
  filename: string;
  saving: boolean;
  loading: boolean;
  currentDocumentId: number;
  documentDetail: any;
  originalDocumentId: number;
  onFilenameChange: (filename: string) => void;
  onEditModeToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
  onClose: () => void;
}