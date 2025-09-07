import React, { useState, useEffect, useMemo } from 'react';
import { KnowledgeDocument } from '../types';
import { 
  getKnowledgeDocuments, 
  getProjectDocumentReferences, 
  setProjectDocumentReferences,
  getConversationDocumentReferences,
  setConversationDocumentReferences,
  getPlanCategories
} from '../api';
import AddDocumentModal from './AddDocumentModal';
import DocumentDetailModal from './DocumentDetailModal';

interface DocumentReferenceModalProps {
  visible: boolean;
  type: 'project' | 'conversation';
  projectId: number;
  conversationId?: string;
  onClose: () => void;
  onUpdate?: () => void;
}

const DocumentReferenceModal: React.FC<DocumentReferenceModalProps> = ({
  visible,
  type,
  projectId,
  conversationId,
  onClose,
  onUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [availableDocuments, setAvailableDocuments] = useState<KnowledgeDocument[]>([]);
  const [currentReferences, setCurrentReferences] = useState<number[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [projectReferencedIds, setProjectReferencedIds] = useState<number[]>([]);

  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [showDocumentDetailModal, setShowDocumentDetailModal] = useState(false);
  const [selectedDocumentForEdit, setSelectedDocumentForEdit] = useState<any>(null);

  // categories for tabs
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all');

  // Load everything
  const loadData = async () => {
    setLoading(true);
    try {
      // 1) categories
      const cats = await getPlanCategories();
      setCategories(cats || []);

      // 2) documents: fetch ALL documents for the project
      const docsResponse = await getKnowledgeDocuments(projectId);
      const allDocs = (docsResponse || []).sort((a: any, b: any) => b.id - a.id);

      if (type === 'project') {
        const refsResponse = await getProjectDocumentReferences(projectId);
        const currentRefIds = (refsResponse || []).map((ref: any) => ref.document_id);
        setAvailableDocuments(allDocs);
        setCurrentReferences(currentRefIds);
        setSelectedDocuments([...currentRefIds]);
        setProjectReferencedIds([]);
      } else {
        if (!conversationId) return;
        const [convRefsResponse, projRefsResponse] = await Promise.all([
          getConversationDocumentReferences(conversationId),
          getProjectDocumentReferences(projectId)
        ]);
        const projRefIds = (projRefsResponse || []).map((ref: any) => ref.document_id);
        // 会话级需排除项目级已引用
        const selectableDocs = allDocs.filter(doc => !projRefIds.includes(doc.id));
        setAvailableDocuments(selectableDocs);
        const currentRefIds = (convRefsResponse || []).map((ref: any) => ref.document_id);
        setCurrentReferences(currentRefIds);
        setSelectedDocuments([...currentRefIds]);
        setProjectReferencedIds(projRefIds);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      alert('加载数据失败: ' + (error as any)?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadData();
      setActiveCategoryId('all');
    }
  }, [visible, type, projectId, conversationId]);

  const handleDocumentToggle = (documentId: number) => {
    setSelectedDocuments(prev => prev.includes(documentId) ? prev.filter(id => id !== documentId) : [...prev, documentId]);
  };

  const handleSelectAll = () => {
    const docIdsInCurrentTab = filteredDocuments.map(d => d.id);
    if (selectedDocuments.filter(id => docIdsInCurrentTab.includes(id)).length === docIdsInCurrentTab.length) {
      // unselect all in current tab
      setSelectedDocuments(prev => prev.filter(id => !docIdsInCurrentTab.includes(id)));
    } else {
      // select all in current tab
      const toAdd = docIdsInCurrentTab.filter(id => !selectedDocuments.includes(id));
      setSelectedDocuments(prev => [...prev, ...toAdd]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (type === 'project') {
        await setProjectDocumentReferences(projectId, selectedDocuments);
      } else if (conversationId) {
        await setConversationDocumentReferences(conversationId, selectedDocuments);
      }
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error('保存引用设置失败:', error);
      let errorMsg = '保存引用设置失败';
      if ((error as any)?.message?.includes('already referenced at project level')) {
        errorMsg = '无法引用：部分文档已在项目级引用中';
      } else {
        errorMsg += ': ' + (error as any)?.message;
      }
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedDocuments([...currentReferences]);
    onClose();
  };

  const handleAddDocumentSuccess = () => {
    setShowAddDocumentModal(false);
    loadData();
  };

  const handleEditDocument = (doc: KnowledgeDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDocumentForEdit({
      id: doc.id,
      document_id: doc.id,
      document_filename: doc.filename,
      document_content: doc.content,
      document_version: doc.version,
      document_created_time: doc.created_time,
    });
    setShowDocumentDetailModal(true);
  };

  const handleDocumentEditSuccess = () => {
    setShowDocumentDetailModal(false);
    setSelectedDocumentForEdit(null);
    loadData();
  };

  // 处理新增文档按钮点击，传递当前选中的分类ID
  const handleAddDocumentClick = () => {
    const categoryId = activeCategoryId === 'all' ? 0 : activeCategoryId;
    setShowAddDocumentModal(true);
  };

  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showAddDocumentModal) {
          setShowAddDocumentModal(false);
        } else if (showDocumentDetailModal) {
          setShowDocumentDetailModal(false);
          setSelectedDocumentForEdit(null);
        } else {
          handleCancel();
        }
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!showAddDocumentModal && !showDocumentDetailModal) {
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [visible, selectedDocuments, showAddDocumentModal, showDocumentDetailModal]);

  const hasChanges = useMemo(() => {
    const a = [...selectedDocuments].sort().join(',');
    const b = [...currentReferences].sort().join(',');
    return a !== b;
  }, [selectedDocuments, currentReferences]);

  // group docs by category id
  const docsByCategory = useMemo(() => {
    const map = new Map<number, KnowledgeDocument[]>();
    for (const d of availableDocuments) {
      const arr = map.get(d.category_id) || [];
      arr.push(d);
      map.set(d.category_id, arr);
    }
    return map;
  }, [availableDocuments]);

  // Build tab list: "全部" + each category that has at least one doc
  const tabs = useMemo(() => {
    const list: Array<{ key: number | 'all'; label: string; count: number }> = [];
    const total = availableDocuments.length;
    list.push({ key: 'all', label: '全部', count: total });
    categories.forEach(cat => {
      const count = docsByCategory.get(cat.id)?.length || 0;
      if (count > 0) list.push({ key: cat.id, label: cat.name, count });
    });
    return list;
  }, [categories, docsByCategory, availableDocuments.length]);

  const filteredDocuments = useMemo(() => {
    if (activeCategoryId === 'all') return availableDocuments;
    return availableDocuments.filter(d => d.category_id === activeCategoryId);
  }, [availableDocuments, activeCategoryId]);

  const isAllSelectedInTab = useMemo(() => {
    const ids = filteredDocuments.map(d => d.id);
    return ids.length > 0 && ids.every(id => selectedDocuments.includes(id));
  }, [filteredDocuments, selectedDocuments]);

  if (!visible) return null;

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
          {/* 左列 - 文档列表带分类Tabs */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Tabs */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #eee', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {tabs.map(tab => (
                <button
                  key={String(tab.key)}
                  onClick={() => setActiveCategoryId(tab.key)}
                  style={{
                    padding: '6px 10px',
                    border: activeCategoryId === tab.key ? '2px solid #1a73e8' : '1px solid #ddd',
                    background: activeCategoryId === tab.key ? '#e8f0fe' : '#fff',
                    borderRadius: 999,
                    color: '#333',
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                  title={`${tab.label} (${tab.count})`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                {filteredDocuments.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    style={{
                      padding: '6px 12px',
                      background: 'none',
                      border: '1px solid #1a73e8',
                      color: '#1a73e8',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    {isAllSelectedInTab ? '本页全不选' : '本页全选'}
                  </button>
                )}
                <button
                  onClick={handleAddDocumentClick}
                  style={{
                    padding: '6px 12px',
                    background: '#4caf50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                  title="新增文档"
                >
                  + 新增文档
                </button>
              </div>
            </div>

            {/* 文档列表 */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#888', fontSize: 16 }}>
                  加载中...
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#888', fontStyle: 'italic', fontSize: 16 }}>
                  当前分类暂无文档
                </div>
              ) : (
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: 16,
                }}>
                  {filteredDocuments.map((doc) => {
                    const isSelected = selectedDocuments.includes(doc.id);
                    const isCurrentlyReferenced = currentReferences.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => handleDocumentToggle(doc.id)}
                        style={{
                          padding: '20px',
                          border: `2px solid ${isSelected ? '#1a73e8' : '#e0e0e0'}`,
                          borderRadius: 12,
                          cursor: 'pointer',
                          background: isSelected ? '#f0f7ff' : '#fff',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                          {/* Checkbox visual */}
                          <div style={{
                            width: 24,
                            height: 24,
                            border: `2px solid ${isSelected ? '#1a73e8' : '#ccc'}`,
                            borderRadius: 6,
                            background: isSelected ? '#1a73e8' : '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: 2,
                          }}>
                            {isSelected && <span style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>✓</span>}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              fontWeight: 600, 
                              fontSize: 16,
                              color: '#333',
                              marginBottom: 8,
                              wordBreak: 'break-word',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}>
                              <span style={{ flex: 1 }}>
                                {doc.filename}
                                {isCurrentlyReferenced && (
                                  <span style={{
                                    marginLeft: 12,
                                    padding: '4px 8px',
                                    background: '#e8f5e8',
                                    color: '#2e7d32',
                                    fontSize: 12,
                                    borderRadius: 4,
                                  }}>
                                    当前引用
                                  </span>
                                )}
                              </span>
                              <button
                                onClick={(e) => handleEditDocument(doc, e)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  color: '#666',
                                  fontSize: '16px',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease',
                                }}
                                title="编辑文档"
                                onMouseEnter={(e) => {
                                  (e.target as HTMLElement).style.background = '#f0f0f0';
                                  (e.target as HTMLElement).style.color = '#1a73e8';
                                }}
                                onMouseLeave={(e) => {
                                  (e.target as HTMLElement).style.background = 'none';
                                  (e.target as HTMLElement).style.color = '#666';
                                }}
                              >
                                ✏️
                              </button>
                            </div>
                            <div style={{ 
                              fontSize: 14, 
                              color: '#666',
                              marginBottom: 12,
                              display: 'flex',
                              gap: 16,
                              flexWrap: 'wrap'
                            }}>
                              <span>ID: {doc.id}</span>
                              <span>分类: {categories.find(c => c.id === doc.category_id)?.name || doc.category_id}</span>
                              <span>版本: v{doc.version}</span>
                              <span>创建: {new Date(doc.created_time).toLocaleDateString()}</span>
                            </div>
                            <div style={{ 
                              fontSize: 13, 
                              color: '#888',
                              maxHeight: 60,
                              overflow: 'hidden',
                              lineHeight: 1.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical'
                            }}>
                              {doc.content.length > 150 ? doc.content.slice(0, 150) + '...' : (doc.content || '(无内容预览)')}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 右列 - 控制区域 */}
          <div style={{ 
            width: '300px', 
            borderLeft: '1px solid #eee',
            background: '#f8f9fa',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 24, color: '#333' }}>
                    {type === 'project' ? '编辑项目级引用' : '编辑会话级引用'}
                  </h2>
                  <div style={{ fontSize: 16, color: '#666', marginTop: 8 }}>
                    {type === 'project'
                      ? `项目ID: ${projectId} | 当前已选择: ${selectedDocuments.length} 个文档`
                      : `会话ID: ${conversationId} | 当前已选择: ${selectedDocuments.length} 个文档`}
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 24,
                    cursor: 'pointer',
                    color: '#999',
                    padding: 0,
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="关闭"
                >
                  ×
                </button>
              </div>

              {hasChanges && (
                <div style={{
                  padding: '12px 16px',
                  background: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: 6,
                  fontSize: 14,
                  color: '#856404',
                  marginBottom: '20px'
                }}>
                  <strong>有 {Math.abs(selectedDocuments.length - currentReferences.length)} 项更改待保存</strong>
                </div>
              )}
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  style={{
                    padding: '12px 20px',
                    background: (saving || !hasChanges) ? '#ccc' : '#1a73e8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: (saving || !hasChanges) ? 'not-allowed' : 'pointer',
                    fontSize: 16,
                    fontWeight: 500,
                  }}
                >
                  {saving ? '保存中...' : '保存 (Ctrl+Enter)'}
                </button>
                <button
                  onClick={handleAddDocumentClick}
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
                  onClick={handleCancel}
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

      <AddDocumentModal
        visible={showAddDocumentModal}
        projectId={projectId}
        onClose={() => setShowAddDocumentModal(false)}
        onSuccess={handleAddDocumentSuccess}
        conversationId={conversationId}
        defaultCategoryId={activeCategoryId === 'all' ? 0 : activeCategoryId as number}
      />

      {showDocumentDetailModal && selectedDocumentForEdit && (
        <DocumentDetailModal
          visible={true}
          document={selectedDocumentForEdit}
          onClose={() => {
            setShowDocumentDetailModal(false);
            setSelectedDocumentForEdit(null);
          }}
          onUpdate={handleDocumentEditSuccess}
        />
      )}
    </>
  );
};

export default DocumentReferenceModal;