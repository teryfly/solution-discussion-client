import React, { useEffect, useState, useCallback } from 'react';
import { KnowledgePanelProps, ReferenceLists } from './KnowledgePanelTypes';
import KnowledgeHeader from './KnowledgeHeader';
import LogsSection from './LogsSection';
import ProjectReferenceModal from '../ProjectReferenceModal';
import ConversationReferenceModal from '../ConversationReferenceModal';
import DocumentDetailModal from '../DocumentDetailModal';
import AddDocumentModal from '../AddDocumentModal';
import {
  getConversationReferencedDocuments,
} from '../../api';
import { DocumentReference } from '../../types';

const KnowledgePanelContainer: React.FC<KnowledgePanelProps> = (props) => {
  const {
    conversationId,
    currentMeta,
    onRefresh,
    executionLogs,
    onClearLogs,
    lastExecutionSummary,
    autoUpdateCode,
    onAutoUpdateCodeChange,
    onDocumentReferencesChange,
  } = props;

  const [refs, setRefs] = useState<ReferenceLists>({
    projectReferences: [],
    conversationReferences: [],
    loading: false,
  });

  const [showProjectReferenceModal, setShowProjectReferenceModal] = useState(false);
  const [showConversationReferenceModal, setShowConversationReferenceModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentReference | null>(null);
  const [showDocumentDetailModal, setShowDocumentDetailModal] = useState(false);
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);

  const loadReferencedDocuments = useCallback(async () => {
    if (!conversationId) {
      setRefs({ projectReferences: [], conversationReferences: [], loading: false });
      return;
    }
    setRefs(prev => ({ ...prev, loading: true }));
    try {
      const data = await getConversationReferencedDocuments(conversationId);
      const sortedProjectRefs = (data.project_references || []).sort((a: any, b: any) => a.id - b.id);
      const sortedConversationRefs = (data.conversation_references || []).sort((a: any, b: any) => a.id - b.id);
      setRefs({ projectReferences: sortedProjectRefs, conversationReferences: sortedConversationRefs, loading: false });
    } catch {
      setRefs({ projectReferences: [], conversationReferences: [], loading: false });
    }
  }, [conversationId]);

  useEffect(() => {
    loadReferencedDocuments();
  }, [conversationId, loadReferencedDocuments]);

  const handleOpenDocumentDetail = (doc: DocumentReference) => {
    setSelectedDocument(doc);
    setShowDocumentDetailModal(true);
  };

  const handleAddDocumentSuccess = () => {
    setShowAddDocumentModal(false);
    loadReferencedDocuments();
    onRefresh?.();
    onDocumentReferencesChange?.();
  };

  const handleQuickRemove = useCallback(async () => {
    await loadReferencedDocuments();
    onDocumentReferencesChange?.();
  }, [loadReferencedDocuments, onDocumentReferencesChange]);

  const handleModalUpdate = useCallback(async () => {
    await loadReferencedDocuments();
    onDocumentReferencesChange?.();
  }, [loadReferencedDocuments, onDocumentReferencesChange]);

  if (!conversationId) {
    return (
      <div style={{
        width: '200px',
        borderLeft: '1px solid #ccc',
        background: '#f9f9fc',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#888',
        fontSize: '14px'
      }}>
        请选择会话
      </div>
    );
  }

  return (
    <div style={{
      width: '200px',
      borderLeft: '1px solid #ccc',
      background: '#f9f9fc',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <KnowledgeHeader
        conversationId={conversationId}
        currentMeta={currentMeta}
        onQuickRemove={handleQuickRemove}
        onOpenProjectModal={() => setShowProjectReferenceModal(true)}
        onOpenConversationModal={() => setShowConversationReferenceModal(true)}
        onOpenDocumentDetail={handleOpenDocumentDetail}
        onAddDocument={() => setShowAddDocumentModal(true)}
        references={refs}
      />

      <div style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <LogsSection
          executionLogs={executionLogs}
          autoUpdateCode={autoUpdateCode}
          onAutoUpdateCodeChange={onAutoUpdateCodeChange}
          onClearLogs={onClearLogs}
        />
      </div>

      {showProjectReferenceModal && currentMeta?.projectId && (
        <ProjectReferenceModal
          visible={true}
          projectId={currentMeta.projectId}
          onClose={() => setShowProjectReferenceModal(false)}
          onUpdate={handleModalUpdate}
        />
      )}

      {showConversationReferenceModal && currentMeta?.projectId && (
        <ConversationReferenceModal
          visible={true}
          conversationId={conversationId}
          projectId={currentMeta.projectId}
          onClose={() => setShowConversationReferenceModal(false)}
          onUpdate={handleModalUpdate}
        />
      )}

      {showDocumentDetailModal && selectedDocument && (
        <DocumentDetailModal
          visible={true}
          document={selectedDocument}
          onClose={() => { setShowDocumentDetailModal(false); setSelectedDocument(null); }}
          onUpdate={handleModalUpdate}
        />
      )}

      {showAddDocumentModal && currentMeta?.projectId && (
        <AddDocumentModal
          visible={true}
          projectId={currentMeta.projectId}
          onClose={() => setShowAddDocumentModal(false)}
          onSuccess={handleAddDocumentSuccess}
          conversationId={conversationId}
          defaultCategoryId={0}
        />
      )}
    </div>
  );
};

export default KnowledgePanelContainer;