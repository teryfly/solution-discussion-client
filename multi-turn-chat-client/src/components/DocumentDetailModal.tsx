import React, { useState, useEffect, useMemo, useRef } from 'react';
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

  // refs for synchronized scrolling
  const lineColRef = useRef<HTMLDivElement>(null);
  const contentColRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  // synchronize scroll like Code View
  useEffect(() => {
    const lineEl = lineColRef.current;
    const contEl = contentColRef.current;
    if (!lineEl || !contEl || editMode) return; // 编辑模式下不需要同步滚动

    const onContentScroll = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      lineEl.scrollTop = contEl.scrollTop;
      requestAnimationFrame(() => (isSyncingRef.current = false));
    };
    const onWheelOnLines = (e: WheelEvent) => {
      if (!contEl) return;
      e.preventDefault();
      contEl.scrollTop += e.deltaY;
    };

    contEl.addEventListener('scroll', onContentScroll);
    lineEl.addEventListener('wheel', onWheelOnLines, { passive: false });

    return () => {
      contEl.removeEventListener('scroll', onContentScroll);
      lineEl.removeEventListener('wheel', onWheelOnLines as any);
    };
  }, [visible, editMode]);

  // Load doc
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

  const handleSave = async () => {
    if (!filename.trim()) {
      alert('文件名不能为空');
      return;
    }
    setSaving(true);
    try {
      const updatedDoc = await updateDocument(currentDocumentId, {
        filename: filename.trim(),
        content: content,
        source: 'user',
      });
      if (updatedDoc.id && updatedDoc.id !== currentDocumentId) {
        setCurrentDocumentId(updatedDoc.id);
        onDocumentChange?.(updatedDoc.id);
        await loadDocumentDetail(updatedDoc.id);
      } else {
        await loadDocumentDetail(currentDocumentId);
      }
      setEditMode(false);
      onUpdate?.();
    } catch (error) {
      console.error('保存文档失败:', error);
      alert('保存文档失败: ' + (error as any)?.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (documentDetail) {
      setFilename(documentDetail.filename || '');
      setContent(documentDetail.content || '');
    }
    setEditMode(false);
  };

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

  // EXACT metrics like Code View for ASCII alignment
  const codeFontFamily =
    "'Consolas','Monaco','Courier New','Liberation Mono','DejaVu Sans Mono',monospace";

  // Use raw lines for numbering (not markdown)
  const rawLines = useMemo(() => (content || '').split('\n'), [content]);
  const lineNumbers = useMemo(
    () => Array.from({ length: rawLines.length }, (_, i) => i + 1),
    [rawLines.length]
  );

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
        {/* Header */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #eee',
            background: '#f8f9fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0, fontFamily: codeFontFamily, fontWeight: 600, fontSize: 16 }}>
            {editMode ? (
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '2px solid #e0e0e0',
                  borderRadius: 8,
                  fontSize: 16,
                  fontFamily: codeFontFamily,
                  boxSizing: 'border-box',
                }}
                placeholder="请输入文件名"
              />
            ) : (
              <div
                style={{
                  color: '#333',
                  lineHeight: 1.25,
                  wordBreak: 'break-word',
                }}
                title={filename}
              >
                {filename}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap', fontFamily: codeFontFamily }}>
              ID: {currentDocumentId} | 版本: {documentDetail?.version || 'N/A'}
              {currentDocumentId !== document.document_id && (
                <span style={{ color: '#4caf50', marginLeft: 6 }}>(已更新为新版本)</span>
              )}
            </div>
            {editMode ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  style={{
                    padding: '6px 10px',
                    background: '#f5f5f5',
                    color: '#666',
                    border: '1px solid #ddd',
                    borderRadius: 6,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '6px 10px',
                    background: saving ? '#ccc' : '#1a73e8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: 13,
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
                    padding: '6px 10px',
                    background: '#1a73e8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  编辑
                </button>
                <button
                  onClick={onClose}
                  style={{
                    padding: '6px 10px',
                    background: '#666',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  关闭
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content area with line numbers (synced) */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {loading ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                color: '#888',
              }}
            >
              加载中...
            </div>
          ) : editMode ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                flex: 1,
                margin: 12,
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: 8,
                fontSize: 13,
                fontFamily: codeFontFamily,
                lineHeight: 1.55,
                resize: 'none',
                boxSizing: 'border-box',
                outline: 'none',
                whiteSpace: 'pre',
              }}
              placeholder="请输入文档内容，支持Markdown格式"
              disabled={saving}
            />
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                background: '#fafafa',
                borderRadius: 8,
                border: '1px solid #eee',
                overflow: 'hidden',
                margin: 12,
                minHeight: 0,
              }}
            >
              {/* Line numbers column - 只在原始代码模式下显示 */}
              {filename && (filename.endsWith('.md') || filename.endsWith('.txt')) ? null : (
                <div
                  ref={lineColRef}
                  style={{
                    userSelect: 'none',
                    background: '#f0f0f6',
                    color: '#aaa',
                    textAlign: 'right',
                    padding: '12px 8px 12px 6px',
                    borderRight: '1px solid #e3e3e8',
                    minWidth: 60,
                    maxWidth: 60,
                    fontFamily: codeFontFamily,
                    fontSize: 12,
                    lineHeight: 1.55,
                    letterSpacing: '0.02em',
                    flexShrink: 0,
                    overflowY: 'hidden', // 修复：隐藏行号列的滚动条
                    overflowX: 'hidden',
                  }}
                  aria-hidden="true"
                >
                  {lineNumbers.map((n) => (
                    <div key={n}>{n}</div>
                  ))}
                </div>
              )}

              {/* Content column - 支持Markdown渲染 */}
              <div
                ref={contentColRef}
                style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: 12,
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                {filename && filename.endsWith('.md') ? (
                  // Markdown渲染模式
                  <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          return (
                            <code
                              className={className}
                              style={{
                                backgroundColor: inline ? '#f1f3f4' : 'transparent',
                                border: inline ? '1px solid #ddd' : 'none',
                                padding: inline ? '2px 4px' : '0',
                                borderRadius: inline ? '3px' : '0',
                                fontSize: inline ? '0.9em' : '1em',
                                fontFamily: codeFontFamily,
                              }}
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        pre({ children }) {
                          return (
                            <pre
                              style={{
                                background: '#f8f9fa',
                                border: '1px solid #e9ecef',
                                borderRadius: 6,
                                padding: 12,
                                overflow: 'auto',
                                fontFamily: codeFontFamily,
                                fontSize: 12,
                                lineHeight: 1.4,
                              }}
                            >
                              {children}
                            </pre>
                          );
                        },
                        h1: ({ children }) => <h1 style={{ fontSize: '2em', fontWeight: 600, marginBottom: '0.5em' }}>{children}</h1>,
                        h2: ({ children }) => <h2 style={{ fontSize: '1.5em', fontWeight: 600, marginBottom: '0.5em' }}>{children}</h2>,
                        h3: ({ children }) => <h3 style={{ fontSize: '1.25em', fontWeight: 600, marginBottom: '0.5em' }}>{children}</h3>,
                        p: ({ children }) => <p style={{ marginBottom: '1em', lineHeight: 1.6 }}>{children}</p>,
                        blockquote: ({ children }) => (
                          <blockquote style={{ 
                            borderLeft: '4px solid #dfe2e5', 
                            paddingLeft: '16px', 
                            margin: '16px 0',
                            color: '#6a737d',
                            fontStyle: 'italic'
                          }}>
                            {children}
                          </blockquote>
                        ),
                        ul: ({ children }) => <ul style={{ paddingLeft: '2em', marginBottom: '1em' }}>{children}</ul>,
                        ol: ({ children }) => <ol style={{ paddingLeft: '2em', marginBottom: '1em' }}>{children}</ol>,
                        li: ({ children }) => <li style={{ marginBottom: '0.25em' }}>{children}</li>,
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  // 原始文本模式（等宽字体）
                  <pre
                    style={{
                      margin: 0,
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      whiteSpace: 'pre',
                      fontFamily: codeFontFamily,
                      fontSize: 13,
                      lineHeight: 1.55,
                    }}
                  >
                    <code style={{ fontFamily: codeFontFamily }}>{content}</code>
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailModal;