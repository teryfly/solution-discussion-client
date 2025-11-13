import React, { useRef, useEffect, useState, useMemo } from 'react';
import { KnowledgeHeaderProps } from './KnowledgePanelTypes';
import {
  clearProjectDocumentReferences,
  clearConversationDocumentReferences,
  getProjectDocumentReferences,
  getConversationDocumentReferences,
  setProjectDocumentReferences,
  setConversationDocumentReferences,
} from '../../api';
import { buildReferencedKnowledgeContent, estimateTokenCount } from '../../utils/knowledgeClipboard';

const KnowledgeHeader: React.FC<KnowledgeHeaderProps> = ({
  conversationId,
  currentMeta,
  onQuickRemove,
  onOpenProjectModal,
  onOpenConversationModal,
  onOpenDocumentDetail,
  onAddDocument,
  references,
}) => {
  const knowledgeAreaRef = useRef<HTMLDivElement>(null);
  const [hoveredDoc, setHoveredDoc] = useState<{ type: 'project' | 'conversation'; id: number } | null>(null);
  const [removingDoc, setRemovingDoc] = useState<{ type: 'project' | 'conversation'; id: number } | null>(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    const area = knowledgeAreaRef.current;
    if (!area) return;
  }, []);

  // 是否有任何引用文档（用于显示复制图标）
  const hasAnyReferences = useMemo(() => {
    return (references.projectReferences?.length || 0) + (references.conversationReferences?.length || 0) > 0;
  }, [references.projectReferences, references.conversationReferences]);

  // 根据后端提供的正确接口语义：需要重写整组引用，即获取全部 -> 过滤 -> 覆盖保存
  const removeOneReference = async (type: 'project' | 'conversation', removeDocumentId: number) => {
    if (type === 'project' && currentMeta?.projectId) {
      const projectId = currentMeta.projectId;
      // 获取当前列表
      const current = await getProjectDocumentReferences(projectId);
      const ids: number[] = (current || []).map((r: any) => r.document_id).filter((id: number) => id !== removeDocumentId);
      // 覆盖保存（若空则清空）
      if (ids.length === 0) {
        await clearProjectDocumentReferences(projectId);
      } else {
        await setProjectDocumentReferences(projectId, ids);
      }
      return;
    }
    if (type === 'conversation' && conversationId) {
      const convId = conversationId;
      const current = await getConversationDocumentReferences(convId);
      const ids: number[] = (current || []).map((r: any) => r.document_id).filter((id: number) => id !== removeDocumentId);
      if (ids.length === 0) {
        await clearConversationDocumentReferences(convId);
      } else {
        await setConversationDocumentReferences(convId, ids);
      }
      return;
    }
    throw new Error('缺少必要的标识参数');
  };

  const handleRemoveReference = async (
    doc: any,
    type: 'project' | 'conversation',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!window.confirm(`确定要删除对文档"${doc.document_filename}"的引用吗？`)) return;

    setRemovingDoc({ type, id: doc.document_id });
    try {
      await removeOneReference(type, doc.document_id);
      onQuickRemove(doc, type, e);
    } catch (error: any) {
      console.error('删除引用失败:', error);
      alert('删除引用失败: ' + (error?.message || '未知错误'));
    } finally {
      setRemovingDoc(null);
    }
  };

  const handleCopyAllKnowledge = async () => {
    if (!conversationId || copying) return;
    try {
      setCopying(true);
      const content = await buildReferencedKnowledgeContent(conversationId);
      if (!content.trim()) {
        // 无引用则不显示图标，通常不会到这里
        return;
      }
      await navigator.clipboard.writeText(content);
      const tokens = estimateTokenCount(content);
      alert(`知识库引用内容已复制到剪贴板，共约 ${tokens} tokens`);
    } catch (e: any) {
      console.error('复制知识库引用失败:', e);
      alert('复制失败，请重试');
    } finally {
      setCopying(false);
    }
  };

  const renderRefList = (
    title: string,
    type: 'project' | 'conversation',
    items: typeof references.projectReferences
  ) => (
    <div style={{ marginBottom: '20px' }}>
      <div
        style={{
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '8px',
          cursor: 'pointer',
          color: '#1a73e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        onClick={type === 'project' ? onOpenProjectModal : onOpenConversationModal}
        title={`点击编辑${title}`}
      >
        <span>{title}</span>
        <span style={{ fontSize: '10px' }}>✏️</span>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            fontSize: '11px',
            color: '#888',
            fontStyle: 'italic',
            padding: '4px 0',
          }}
        >
          暂无引用
        </div>
      ) : (
        <div>
          {items.map((doc) => {
            const isRemoving = removingDoc?.type === type && removingDoc?.id === doc.document_id;
            const isHovered = hoveredDoc?.type === type && hoveredDoc?.id === doc.document_id;

            return (
              <div
                key={doc.id}
                style={{
                  fontSize: '11px',
                  padding: '4px 6px',
                  marginBottom: '4px',
                  background: type === 'project' ? '#e8f0fe' : '#f1f3f4',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: `1px solid ${type === 'project' ? '#d0e4ff' : '#e0e0e0'}`,
                  wordBreak: 'break-word',
                  lineHeight: '1.3',
                  position: 'relative',
                  opacity: isRemoving ? 0.5 : 1,
                  pointerEvents: isRemoving ? 'none' : 'auto',
                }}
                onClick={() => onOpenDocumentDetail(doc)}
                onMouseEnter={() => setHoveredDoc({ type, id: doc.document_id })}
                onMouseLeave={() => setHoveredDoc(null)}
                title={`${doc.document_filename} (v${doc.document_version})`}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginRight: '4px',
                    }}
                  >
                    {doc.document_filename.length > 15
                      ? doc.document_filename.slice(0, 15) + '...'
                      : doc.document_filename}
                  </span>
                  {isHovered ? (
                    <span
                      style={{
                        color: '#f44336',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        cursor: 'pointer',
                        padding: '0 2px',
                        borderRadius: '2px',
                        background: 'rgba(244, 67, 54, 0.1)',
                      }}
                      onClick={(e) => handleRemoveReference(doc, type, e)}
                      title="删除引用"
                    >
                      ×
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '10px',
                        color: '#666',
                        fontStyle: 'italic',
                        flexShrink: 0,
                      }}
                    >
                      v{doc.document_version}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={knowledgeAreaRef}
      style={{
        padding: '10px',
        overflow: 'auto',
        borderBottom: '1px solid #ddd',
        flexShrink: 0,
        maxHeight: '60vh',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '0 0 16px 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h4
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#333',
            }}
          >
            文档
          </h4>
          {hasAnyReferences && (
            <button
              onClick={handleCopyAllKnowledge}
              disabled={copying}
              title={copying ? '复制中...' : '复制引用的全部知识库内容'}
              style={{
                background: copying ? '#ccc' : '#1a73e8',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: 12,
                cursor: copying ? 'not-allowed' : 'pointer',
              }}
            >
              复制
            </button>
          )}
        </div>
        <button
          onClick={onAddDocument}
          style={{
            background: '#1a73e8',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
          title="新增文档"
        >
          +
        </button>
      </div>

      {renderRefList('项目级引用', 'project', references.projectReferences)}
      {renderRefList('会话级引用', 'conversation', references.conversationReferences)}
    </div>
  );
};

export default KnowledgeHeader;