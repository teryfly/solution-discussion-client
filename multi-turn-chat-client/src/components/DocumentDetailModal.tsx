import React from 'react';
import { DocumentDetailModalProps } from './document_detail/types';
import { useDocumentDetail } from './document_detail/useDocumentDetail';
import DocumentHeader from './document_detail/DocumentHeader';
import DocumentViewer from './document_detail/DocumentViewer';

const DocumentDetailModal: React.FC<DocumentDetailModalProps> = (props) => {
  const { visible, document, onClose } = props;
  const { state, refs, actions } = useDocumentDetail(props);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        }}
      >
        <DocumentHeader
          editMode={state.editMode}
          filename={state.filename}
          saving={state.saving}
          loading={state.loading}
          currentDocumentId={state.currentDocumentId}
          documentDetail={state.documentDetail}
          originalDocumentId={document.document_id}
          onFilenameChange={actions.setFilename}
          onEditModeToggle={() => actions.setEditMode(true)}
          onSave={actions.handleSave}
          onCancel={actions.handleCancelEdit}
          onClose={onClose}
        />

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <DocumentViewer
            content={state.content}
            filename={state.filename}
            loading={state.loading}
            editMode={state.editMode}
            saving={state.saving}
            onContentChange={actions.setContent}
            lineColRef={refs.lineColRef}
            contentColRef={refs.contentColRef}
            textareaRef={refs.textareaRef}
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailModal;