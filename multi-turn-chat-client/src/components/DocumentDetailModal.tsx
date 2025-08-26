import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DocumentReference } from '../types';
import { getDocumentDetail, updateDocument } from '../api';

interface DocumentDetailModalProps {
  visible: boolean;
  document: DocumentReference;
  onClose: () => void;
  onUpdate?: () => void;
  onDocumentChange?: (newDocumentId: number) => void;
}

const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  visible,
  document,
  onClose,
  onUpdate,
  onDocumentChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [documentDetail, setDocumentDetail] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [filename, setFilename] = useState('');
  const [content, setContent] = useState('');
  const [currentDocumentId, setCurrentDocumentId] = useState(document.document_id);

  // 加载文档详情
  const loadDocumentDetail = async (docId: number) => {
    setLoading(true);
    try {
      const detail = await getDocumentDetail(docId);
      setDocumentDetail(detail);
      setFilename(detail.filename || '');
      setContent(detail.content || '');
      setCurrentDocumentId(docId);
    } catch (error) {
      console.error('加载文档详情失败:', error);
      alert('加载文档详情失败: ' + (error as any)?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadDocumentDetail(document.document_id);
      setEditMode(false);
    }
  }, [visible, document.document_id]);

  // 保存文档（创建新版本）
  const handleSave = async () => {
    if (!filename.trim()) {
      alert('文件名不能为空');
      return;
    }

    setSaving(true);
    try {
      // 调用更新API，这会创建新版本
      const updatedDoc = await updateDocument(currentDocumentId, {
        filename: filename.trim(),
        content: content,
        source: 'user'
      });
      
      // 如果返回了新的文档ID，说明创建了新版本
      if (updatedDoc.id && updatedDoc.id !== currentDocumentId) {
        setCurrentDocumentId(updatedDoc.id);
        // 通知父组件文档ID已变化，需要更新引用关系
        onDocumentChange?.(updatedDoc.id);
        // 重新加载新版本的文档详情
        await loadDocumentDetail(updatedDoc.id);
      } else {
        // 如果是同一个文档，重新加载详情
        await loadDocumentDetail(currentDocumentId);
      }
      
      setEditMode(false);
      onUpdate?.();
      // 移除成功提示弹窗
    } catch (error) {
      console.error('保存文档失败:', error);
      alert('保存文档失败: ' + (error as any)?.message);
    } finally {
      setSaving(false);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    if (documentDetail) {
      setFilename(documentDetail.filename || '');
      setContent(documentDetail.content || '');
    }
    setEditMode(false);
  };

  // 键盘快捷键支持
  useEffect(() => {
    if (!visible) return;
    
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (editMode) {
          handleCancelEdit();
        } else {
          onClose();
        }
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && editMode) {
        e.preventDefault();
        handleSave();
      }
    };
    
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [visible, editMode, filename, content]);

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
        {/* 头部 */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            background: '#f8f9fa',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 24, color: '#333' }}>
              {editMode ? '编辑文档' : '查看文档'}
            </h2>
            <div style={{ fontSize: 16, color: '#666', marginTop: 8 }}>
              ID: {currentDocumentId} | 版本: {documentDetail?.version || 'N/A'}
              {currentDocumentId !== document.document_id && (
                <span style={{ color: '#4caf50', marginLeft: 12 }}>
                  (已更新为新版本)
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 32,
              cursor: 'pointer',
              color: '#999',
              padding: 0,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="关闭"
          >
            ×
          </button>
        </div>

        {/* 内容区域 */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ 
              flex: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: 18, 
              color: '#888' 
            }}>
              加载中...
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* 文件名区域 */}
              <div style={{ 
                padding: '20px 24px', 
                borderBottom: '1px solid #eee',
                background: '#fff',
                flexShrink: 0
              }}>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 12, fontSize: 16 }}>
                  文件名：
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e0e0e0',
                      borderRadius: 8,
                      fontSize: 16,
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                    placeholder="请输入文件名"
                  />
                ) : (
                  <div style={{ 
                    padding: '12px 16px',
                    background: '#f8f9fa',
                    borderRadius: 8,
                    fontFamily: 'monospace',
                    fontSize: 16,
                    border: '2px solid #e8e8e8',
                  }}>
                    {filename}
                  </div>
                )}
              </div>

              {/* 内容区域 */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <div style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  padding: '20px 24px',
                  overflow: 'hidden'
                }}>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: 600, 
                    marginBottom: 12, 
                    fontSize: 16,
                    flexShrink: 0
                  }}>
                    内容：
                  </label>
                  {editMode ? (
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '16px',
                        border: '2px solid #e0e0e0',
                        borderRadius: 8,
                        fontSize: 15,
                        fontFamily: 'monospace',
                        lineHeight: 1.6,
                        resize: 'none',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                      placeholder="请输入文档内容，支持Markdown格式"
                      disabled={saving}
                    />
                  ) : (
                    <div style={{ 
                      flex: 1,
                      padding: '20px',
                      background: '#fafafa',
                      borderRadius: 8,
                      overflow: 'auto',
                      border: '2px solid #e8e8e8',
                    }}>
                      {content ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => <h1 style={{ color: '#333', borderBottom: '2px solid #eee', paddingBottom: '8px' }}>{children}</h1>,
                            h2: ({ children }) => <h2 style={{ color: '#444', borderBottom: '1px solid #eee', paddingBottom: '6px' }}>{children}</h2>,
                            h3: ({ children }) => <h3 style={{ color: '#555' }}>{children}</h3>,
                            code: ({ inline, children, ...props }) => 
                              inline ? (
                                <code style={{ 
                                  background: '#f0f0f0', 
                                  padding: '2px 6px', 
                                  borderRadius: '4px',
                                  fontFamily: 'monospace',
                                  fontSize: '0.9em'
                                }} {...props}>
                                  {children}
                                </code>
                              ) : (
                                <pre style={{ 
                                  background: '#f8f8f8', 
                                  padding: '16px', 
                                  borderRadius: '8px',
                                  overflow: 'auto',
                                  border: '1px solid #e0e0e0'
                                }}>
                                  <code style={{ fontFamily: 'monospace' }} {...props}>
                                    {children}
                                  </code>
                                </pre>
                              ),
                            blockquote: ({ children }) => (
                              <blockquote style={{
                                borderLeft: '4px solid #1a73e8',
                                margin: '16px 0',
                                padding: '12px 20px',
                                background: '#f0f7ff',
                                fontStyle: 'italic'
                              }}>
                                {children}
                              </blockquote>
                            ),
                            table: ({ children }) => (
                              <table style={{
                                borderCollapse: 'collapse',
                                width: '100%',
                                margin: '16px 0',
                                border: '1px solid #ddd'
                              }}>
                                {children}
                              </table>
                            ),
                            th: ({ children }) => (
                              <th style={{
                                border: '1px solid #ddd',
                                padding: '12px',
                                background: '#f5f5f5',
                                fontWeight: 'bold',
                                textAlign: 'left'
                              }}>
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td style={{
                                border: '1px solid #ddd',
                                padding: '12px'
                              }}>
                                {children}
                              </td>
                            ),
                          }}
                        >
                          {content}
                        </ReactMarkdown>
                      ) : (
                        <div style={{ 
                          color: '#999', 
                          fontStyle: 'italic',
                          textAlign: 'center',
                          paddingTop: '40px',
                          fontSize: '16px'
                        }}>
                          (空内容)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div
          style={{
            padding: '20px 24px',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 16,
            flexShrink: 0,
            background: '#f8f9fa',
          }}
        >
          {editMode ? (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  background: '#f5f5f5',
                  color: '#666',
                  border: '2px solid #ddd',
                  borderRadius: 8,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '12px 24px',
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
            </>
          ) : (
            <>
              <button
                onClick={() => setEditMode(true)}
                disabled={loading}
                style={{
                  padding: '12px 24px',
                  background: '#1a73e8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                编辑
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '12px 24px',
                  background: '#666',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 500,
                }}
              >
                关闭
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailModal;