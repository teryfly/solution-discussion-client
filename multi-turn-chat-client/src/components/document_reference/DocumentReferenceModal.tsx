import React, { useMemo, useState, useEffect } from 'react';
import type { DocumentReferenceModalProps } from './types';
import { useDocumentReferenceData, useDocumentReferenceActions } from './useDocumentReference';
import { TabsBar, SideHeader } from './LayoutParts';
import { DocList } from './DocList';
import AddDocumentModal from '../AddDocumentModal';
import DocumentDetailModal from '../DocumentDetailModal';
import { KnowledgeDocument } from '../../types';

const DocumentReferenceModal: React.FC<DocumentReferenceModalProps> = (props) => {
  const state = useDocumentReferenceData(props);
  const actions = useDocumentReferenceActions(props, state);

  const {
    visible,
    type,
    projectId,
    conversationId,
    onClose,
  } = props;

  const {
    loading,
    saving,
    availableDocuments,
    currentReferences,
    categories,
    activeCategoryId,
    setActiveCategoryId,
    filteredDocuments,
    isAllSelectedInTab,
    reload,
  } = state;

  const { toggleSelect, selectAllInTab, save } = actions;

  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [showDocumentDetailModal, setShowDocumentDetailModal] = useState(false);
  const [selectedDocumentForEdit, setSelectedDocumentForEdit] = useState<KnowledgeDocument | null>(null);

  useEffect(() => {
    if (visible) setActiveCategoryId('all');
  }, [visible, setActiveCategoryId]);

  // 兜底：如果引用页未显式传入 conversationId，则尝试从 URL 上下文注入
  const fallbackConversationId = useMemo(() => {
    if (conversationId) return conversationId;
    try {
      const url = new URL(window.location.href);
      const byQuery = url.searchParams.get('session');
      if (byQuery) return byQuery;
      const match = url.pathname.match(/\/chat\/([^/?#]+)/);
      if (match && match[1]) return match[1];
    } catch {}
    return undefined;
  }, [conversationId]);

  if (!visible) return null;

  const tabs = useMemo(() => {
    const list: Array<{ key: number | 'all'; label: string; count: number }> = [];
    const total = availableDocuments.length;
    list.push({ key: 'all', label: '全部', count: total });
    categories.forEach((cat) => {
      const count = availableDocuments.filter((d) => d.category_id === cat.id).length;
      if (count > 0) list.push({ key: cat.id, label: cat.name, count });
    });
    return list;
  }, [categories, availableDocuments]);

  return (
    <>
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
            flexDirection: 'row',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <TabsBar
              tabs={tabs}
              active={activeCategoryId}
              onChange={setActiveCategoryId}
              onAdd={() => setShowAddDocumentModal(true)}
              onSelectAll={selectAllInTab}
              showSelectAll={filteredDocuments.length > 0}
            />
            <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
              <DocList
                loading={loading}
                docs={filteredDocuments}
                currentReferences={currentReferences}
                categories={categories}
                onToggle={toggleSelect}
                onEdit={(doc, e) => {
                  e.stopPropagation();
                  // 修正点：使用列表项中返回的文档ID，避免传入 undefined
                  // availableDocuments/filteredDocuments 的每个 doc 都有合法的 id
                  setSelectedDocumentForEdit(doc);
                  setShowDocumentDetailModal(true);
                }}
              />
            </div>
          </div>

          <div
            style={{
              width: '300px',
              borderLeft: "1px solid #eee",
              background: '#f8f9fa',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <SideHeader
              title={type === 'project' ? '编辑项目级引用' : '编辑会话级引用'}
              subtitle={
                type === 'project'
                  ? `项目ID: ${projectId} | 当前已选择: ${currentReferences.length} 个文档`
                  : `会话ID: ${fallbackConversationId || '(未知)'} | 当前已选择: ${currentReferences.length} 个文档`
              }
              onClose={onClose}
            />

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  onClick={save}
                  disabled={saving}
                  style={{
                    padding: '12px 20px',
                    background: saving ? '#ccc' : '#1a73e8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: 16,
                    fontWeight: 500,
                  }}
                >
                  {saving ? '保存中...' : '保存 (Ctrl+Enter)'}
                </button>
                <button
                  onClick={() => setShowAddDocumentModal(true)}
                  style={{
                    padding: '10px 20px',
                    background: '#4caf50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                  title="新增文档"
                >
                  + 新增文档
                </button>
                <button
                  onClick={onClose}
                  disabled={saving}
                  style={{
                    padding: '12px 20px',
                    background: '#f5f5f5',
                    color: '#666',
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 16,
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddDocumentModal && (
        <AddDocumentModal
          visible={true}
          projectId={projectId}
          onClose={() => setShowAddDocumentModal(false)}
          onSuccess={() => {
            setShowAddDocumentModal(false);
            reload();
          }}
          conversationId={fallbackConversationId}
          defaultCategoryId={activeCategoryId === 'all' ? 0 : (activeCategoryId as number)}
          fromReference={true}
        />
      )}

      {showDocumentDetailModal && selectedDocumentForEdit && (
        <DocumentDetailModal
          visible={true}
          // 修正点：明确传入 document_id，避免 undefined
          document={{
            id: selectedDocumentForEdit.id,
            project_id: selectedDocumentForEdit.project_id,
            conversation_id: undefined,
            document_id: selectedDocumentForEdit.id,
            reference_type: 'project',
            document_filename: selectedDocumentForEdit.filename,
            document_content: selectedDocumentForEdit.content,
            document_version: selectedDocumentForEdit.version,
            document_created_time: selectedDocumentForEdit.created_time,
          } as any}
          onClose={() => {
            setShowDocumentDetailModal(false);
            setSelectedDocumentForEdit(null);
          }}
          onUpdate={reload}
        />
      )}
    </>
  );
};

export default DocumentReferenceModal;