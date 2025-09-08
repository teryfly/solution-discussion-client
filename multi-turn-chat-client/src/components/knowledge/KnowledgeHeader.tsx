import React, { useRef, useEffect, useState } from 'react';
import { KnowledgeHeaderProps } from './KnowledgePanelTypes';
import {
  clearProjectDocumentReferences,
  clearConversationDocumentReferences,
  getProjectDocumentReferences,
  getConversationDocumentReferences,
  setProjectDocumentReferences,
  setConversationDocumentReferences,
} from '../../api';

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

  useEffect(() => {
    const area = knowledgeAreaRef.current;
    if (!area) return;
  }, []);

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