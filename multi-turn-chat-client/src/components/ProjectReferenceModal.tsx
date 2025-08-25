import React from 'react';
import DocumentReferenceModal from './DocumentReferenceModal';

interface ProjectReferenceModalProps {
  visible: boolean;
  projectId: number;
  onClose: () => void;
  onUpdate?: () => void;
}

const ProjectReferenceModal: React.FC<ProjectReferenceModalProps> = ({
  visible,
  projectId,
  onClose,
  onUpdate,
}) => {
  return (
    <DocumentReferenceModal
      visible={visible}
      type="project"
      projectId={projectId}
      onClose={onClose}
      onUpdate={onUpdate}
    />
  );
};

export default ProjectReferenceModal;