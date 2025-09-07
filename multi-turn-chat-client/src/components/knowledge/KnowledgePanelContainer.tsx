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
  getProjectDocumentReferences,
  setProjectDocumentReferences,
  getConversationDocumentReferences,
  setConversationDocumentReferences
} from '../../api';
import { DocumentReference } from '../../types';

const KnowledgePanelContainer: React.FC<KnowledgePanelProps> = ({
  conversationId,
  currentMeta,
  onRefresh,
  executionLogs,
  onClearLogs,
  lastExecutionSummary, // reserved for future use
  autoUpdateCode,
  onAutoUpdateCodeChange,
  onDocumentReferencesChange,
}) => {
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

  const handleDocumentChange = async (newDocumentId: number) => {
    if (!selectedDocument) return;
    try {
      const oldDocumentId = selectedDocument.document_id;
      // project level
      if (refs.projectReferences.some(ref => ref.document_id === oldDocumentId) && currentMeta?.projectId) {
        const currentRefs = await getProjectDocumentReferences(currentMeta.projectId);
        const currentRefIds = currentRefs.map((ref: any) => ref.document_id);
        const newRefIds = currentRefIds.map((id: number) => (id === oldDocumentId ? newDocumentId : id));
        await setProjectDocumentReferences(currentMeta.projectId, newRefIds);
      }
      // conversation level
      if (refs.conversationReferences.some(ref => ref.document_id === oldDocumentId)) {
        const currentRefs = await getConversationDocumentReferences(conversationId);
        const currentRefIds = currentRefs.map((ref: any) => ref.document_id);
        const newRefIds = currentRefIds.map((id: number) => (id === oldDocumentId ? newDocumentId : id));
        await setConversationDocumentReferences(conversationId, newRefIds);
      }
      await loadReferencedDocuments();
      onRefresh?.();
      onDocumentReferencesChange?.();
    } catch (e) {
      alert('更新文档引用关系失败');
    }
  };

  const handleQuickRemove = async (doc: DocumentReference, type: 'project' | 'conversation', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (type === 'project' && currentMeta?.projectId) {
        const currentRefs = await getProjectDocumentReferences(currentMeta.projectId);
        const ids = currentRefs.map((r: any) => r.document_id).filter((id: number) => id !== doc.document_id);
        await setProjectDocumentReferences(currentMeta.projectId, ids);
      } else if (type === 'conversation') {
        const currentRefs = await getConversationDocumentReferences(conversationId);
        const ids = currentRefs.map((r: any) => r.document_id).filter((id: number) => id !== doc.document_id);
        await setConversationDocumentReferences(conversationId, ids);
      }
      await loadReferencedDocuments();
      onRefresh?.();
      onDocumentReferencesChange?.();
    } catch {}
  };

  const handleRefreshReferences = async () => {
    await loadReferencedDocuments();
    onRefresh?.();
    onDocumentReferencesChange?.();
  };

  const handleAddDocument = () => {
    setShowAddDocumentModal(true);
  };

  const handleAddDocumentSuccess = () => {
    setShowAddDocumentModal(false);
    handleRefreshReferences();
  };

  if (!conversationId) {
    return (
      <div style={{ 
        width: '200px', 
        borderLeft: '1px solid #ccc', 
        padding: '10px',
        background: '#f9f9fc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#888',
        fontSize: '14px',
        height: '100vh'
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
      {/* Top references area */}
      <KnowledgeHeader
        conversationId={conversationId}
        currentMeta={currentMeta}
        onQuickRemove={handleQuickRemove}
        onOpenProjectModal={() => setShowProjectReferenceModal(true)}
        onOpenConversationModal={() => setShowConversationReferenceModal(true)}
        onOpenDocumentDetail={handleOpenDocumentDetail}
        onAddDocument={handleAddDocument}
        references={refs}
      />

      {/* Bottom logs area */}
      <div style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <LogsSection
          executionLogs={executionLogs}
          autoUpdateCode={autoUpdateCode}
          onAutoUpdateCodeChange={onAutoUpdateCodeChange}
          onClearLogs={onClearLogs}
        />
      </div>

      {/* Modals */}
      {showProjectReferenceModal && currentMeta?.projectId && (
        <ProjectReferenceModal
          visible={true}
          projectId={currentMeta.projectId}
          onClose={() => setShowProjectReferenceModal(false)}
          onUpdate={handleRefreshReferences}
        />
      )}
      {showConversationReferenceModal && currentMeta?.projectId && (
        <ConversationReferenceModal
          visible={true}
          conversationId={conversationId}
          projectId={currentMeta.projectId}
          onClose={() => setShowConversationReferenceModal(false)}
          onUpdate={handleRefreshReferences}
        />
      )}
      {showDocumentDetailModal && selectedDocument && (
        <DocumentDetailModal
          visible={true}
          document={selectedDocument}
          onClose={() => { setShowDocumentDetailModal(false); setSelectedDocument(null); }}
          onUpdate={handleRefreshReferences}
          onDocumentChange={handleDocumentChange}
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