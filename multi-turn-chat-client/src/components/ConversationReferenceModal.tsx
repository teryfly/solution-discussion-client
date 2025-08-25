import React from 'react';
import DocumentReferenceModal from './DocumentReferenceModal';

interface ConversationReferenceModalProps {
  visible: boolean;
  conversationId: string;
  projectId: number;
  onClose: () => void;
  onUpdate?: () => void;
}

const ConversationReferenceModal: React.FC<ConversationReferenceModalProps> = ({
  visible,
  conversationId,
  projectId,
  onClose,
  onUpdate,
}) => {
  return (
    <DocumentReferenceModal
      visible={visible}
      type="conversation"
      projectId={projectId}
      conversationId={conversationId}
      onClose={onClose}
      onUpdate={onUpdate}
    />
  );
};

export default ConversationReferenceModal;