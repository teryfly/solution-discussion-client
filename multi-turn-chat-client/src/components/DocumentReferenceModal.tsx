import React, { useState, useEffect } from 'react';
import { KnowledgeDocument } from '../types';
import { 
  getKnowledgeDocuments, 
  getProjectDocumentReferences, 
  setProjectDocumentReferences,
  getConversationDocumentReferences,
  setConversationDocumentReferences
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

  // 获取标题和描述
  const getTitle = () => type === 'project' ? '编辑项目级引用' : '编辑会话级引用';
  const getSubtitle = () => {
    if (type === 'project') {
      return `项目ID: ${projectId} | 当前已选择: ${selectedDocuments.length} 个文档`;
    } else {
      return `会话ID: ${conversationId} | 当前已选择: ${selectedDocuments.length} 个文档`;
    }
  };

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      if (type === 'project') {
        // 项目级引用：加载所有知识库文档和当前项目引用
        const [docsResponse, refsResponse] = await Promise.all([
          getKnowledgeDocuments(projectId),
          getProjectDocumentReferences(projectId)
        ]);

        // 按ID倒序排序
        const sortedDocs = (docsResponse || []).sort((a, b) => b.id - a.id);
        setAvailableDocuments(sortedDocs);
        const currentRefIds = (refsResponse || []).map((ref: any) => ref.document_id);
        setCurrentReferences(currentRefIds);
        setSelectedDocuments([...currentRefIds]);
        setProjectReferencedIds([]);
      } else {
        // 会话级引用：需要排除项目级已引用的文档
        if (!conversationId) return;
        
        const [docsResponse, convRefsResponse, projRefsResponse] = await Promise.all([
          getKnowledgeDocuments(projectId),
          getConversationDocumentReferences(conversationId),
          getProjectDocumentReferences(projectId)
        ]);

        const allDocs = docsResponse || [];
        const projRefIds = (projRefsResponse || []).map((ref: any) => ref.document_id);
        
        // 过滤出可选择的文档（排除项目级已引用的）并按ID倒序排序
        const selectableDocs = allDocs
          .filter(doc => !projRefIds.includes(doc.id))
          .sort((a, b) => b.id - a.id);
        
        setAvailableDocuments(selectableDocs);
        setProjectReferencedIds(projRefIds);
        
        const currentRefIds = (convRefsResponse || []).map((ref: any) => ref.document_id);
        setCurrentReferences(currentRefIds);
        setSelectedDocuments([...currentRefIds]);
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
    }
  }, [visible, type, projectId, conversationId]);

  // 处理文档选择
  const handleDocumentToggle = (documentId: number) => {
    setSelectedDocuments(prev => {
      if (prev.includes(documentId)) {
        return prev.filter(id => id !== documentId);
      } else {
        return [...prev, documentId];
      }
    });
  };

  // 全选/全不选
  const handleSelectAll = () => {
    if (selectedDocuments.length === availableDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(availableDocuments.map(doc => doc.id));
    }
  };

  // 保存引用设置
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

  // 取消编辑
  const handleCancel = () => {
    setSelectedDocuments([...currentReferences]);
    onClose();
  };

  // 新增文档成功后的回调
  const handleAddDocumentSuccess = () => {
    setShowAddDocumentModal(false);
    // 重新加载文档列表
    loadData();
  };

  // 打开编辑文档弹窗
  const handleEditDocument = (doc: KnowledgeDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    // 转换为DocumentReference格式
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

  // 编辑文档成功后的回调
  const handleDocumentEditSuccess = () => {
    setShowDocumentDetailModal(false);
    setSelectedDocumentForEdit(null);
    // 重新加载文档列表
    loadData();
  };

  // 键盘快捷键支持
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

  if (!visible) return null;

  const hasChanges = JSON.stringify([...selectedDocuments].sort()) !== JSON.stringify([...currentReferences].sort());

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
          {/* 左列 - 文档列表 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* 文档列表 */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
              {/* 说明信息（仅会话级引用显示） */}
              {type === 'conversation' && projectReferencedIds.length > 0 && (
                <div style={{
                  marginBottom: 20,
                  padding: '12px 16px',
                  background: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: 6,
                  fontSize: 14,
                  color: '#856404'
                }}>
                  <strong>注意：</strong> 已排除 {projectReferencedIds.length} 个项目级引用的文档，避免重复引用。
                </div>
              )}

              {loading ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 60, 
                  color: '#888',
                  fontSize: 16 
                }}>
                  加载中...
                </div>
              ) : availableDocuments.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: 60, 
                  color: '#888',
                  fontStyle: 'italic',
                  fontSize: 16 
                }}>
                  {type === 'conversation' && projectReferencedIds.length > 0 
                    ? '该项目的知识库文档均已在项目级引用，无可选择的文档'
                    : '该项目暂无知识库文档'
                  }
                  <div style={{ marginTop: 20 }}>
                    <button
                      onClick={() => setShowAddDocumentModal(true)}
                      style={{
                        padding: '10px 20px',
                        background: '#1a73e8',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      + 新增文档
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: 16,
                }}>
                  {availableDocuments.map((doc) => {
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
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start',
                          gap: 16
                        }}>
                          {/* 复选框 */}
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
                            {isSelected && (
                              <span style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>✓</span>
                            )}
                          </div>

                          {/* 文档信息 */}
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
                                    fontWeight: 'normal'
                                  }}>
                                    当前引用
                                  </span>
                                )}
                              </span>
                              {/* 编辑图标 */}
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
                              {doc.content.length > 150 
                                ? doc.content.slice(0, 150) + '...'
                                : doc.content || '(无内容预览)'
                              }
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
            {/* 顶部信息 */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 24, color: '#333' }}>
                    {getTitle()}
                  </h2>
                  <div style={{ fontSize: 16, color: '#666', marginTop: 8 }}>
                    {getSubtitle()}
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

              <div style={{ marginBottom: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: 16, color: '#333', fontWeight: 500 }}>
                    知识库文档列表 ({availableDocuments.length})
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {/* 全选按钮 */}
                    {availableDocuments.length > 0 && (
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
                        {selectedDocuments.length === availableDocuments.length ? '全不选' : '全选'}
                      </button>
                    )}
                  </div>
                </div>
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

            {/* 底部操作按钮 - 恢复垂直布局 */}
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
                
                {/* 新增按钮放在保存按钮之后 */}
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

      {/* 新增文档弹窗 */}
      <AddDocumentModal
        visible={showAddDocumentModal}
        projectId={projectId}
        onClose={() => setShowAddDocumentModal(false)}
        onSuccess={handleAddDocumentSuccess}
      />

      {/* 编辑文档弹窗 */}
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