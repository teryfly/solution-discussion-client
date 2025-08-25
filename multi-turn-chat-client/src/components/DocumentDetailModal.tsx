import React, { useState, useEffect } from 'react';
import { DocumentReference } from '../types';
import { getDocumentDetail, updateDocument } from '../api';

interface DocumentDetailModalProps {
  visible: boolean;
  document: DocumentReference;
  onClose: () => void;
  onUpdate?: () => void;
}

const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  visible,
  document,
  onClose,
  onUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [documentDetail, setDocumentDetail] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [filename, setFilename] = useState('');
  const [content, setContent] = useState('');

  // 加载文档详情
  const loadDocumentDetail = async () => {
    setLoading(true);
    try {
      const detail = await getDocumentDetail(document.document_id);
      setDocumentDetail(detail);
      setFilename(detail.filename || '');
      setContent(detail.content || '');
    } catch (error) {
      console.error('加载文档详情失败:', error);
      alert('加载文档详情失败: ' + (error as any)?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadDocumentDetail();
      setEditMode(false);
    }
  }, [visible, document.document_id]);

  // 保存文档
  const handleSave = async () => {
    if (!filename.trim()) {
      alert('文件名不能为空');
      return;
    }

    setSaving(true);
    try {
      await updateDocument(document.document_id, {
        filename: filename.trim(),
        content: content,
        source: 'user'
      });
      
      setEditMode(false);
      onUpdate?.();
      alert('文档保存成功');
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
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          width: '90%',
          maxWidth: 900,
          height: '80%',
          maxHeight: 700,
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
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: '#333' }}>
              {editMode ? '编辑文档' : '查看文档'}
            </h2>
            <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
              ID: {document.document_id} | 版本: {document.document_version}
            </div>
          </div>
          <button
            onClick={onClose}
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

        {/* 内容区域 */}
        <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
              加载中...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* 文件名 */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>
                  文件名：
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ccc',
                      borderRadius: 6,
                      fontSize: 15,
                    }}
                    placeholder="请输入文件名"
                  />
                ) : (
                  <div style={{ 
                    padding: '10px 12px',
                    background: '#f5f5f5',
                    borderRadius: 6,
                    fontFamily: 'monospace',
                    fontSize: 15,
                  }}>
                    {filename}
                  </div>
                )}
              </div>

              {/* 内容 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>
                  内容：
                </label>
                {editMode ? (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '1px solid #ccc',
                      borderRadius: 6,
                      fontSize: 14,
                      fontFamily: 'monospace',
                      lineHeight: 1.5,
                      resize: 'none',
                      minHeight: 300,
                    }}
                    placeholder="请输入文档内容"
                  />
                ) : (
                  <div style={{ 
                    flex: 1,
                    padding: '12px',
                    background: '#f5f5f5',
                    borderRadius: 6,
                    fontFamily: 'monospace',
                    fontSize: 14,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    overflow: 'auto',
                    minHeight: 300,
                    border: '1px solid #e0e0e0',
                  }}>
                    {content || '(空内容)'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            flexShrink: 0,
          }}
        >
          {editMode ? (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                style={{
                  padding: '8px 16px',
                  background: '#f5f5f5',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '8px 16px',
                  background: saving ? '#ccc' : '#1a73e8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: saving ? 'not-allowed' : 'pointer',
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
                  padding: '8px 16px',
                  background: '#1a73e8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                编辑
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  background: '#666',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
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