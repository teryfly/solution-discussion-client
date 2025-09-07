import React, { useRef, useEffect, useState } from 'react';
import { KnowledgeHeaderProps } from './KnowledgePanelTypes';

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

  useEffect(() => {
    const area = knowledgeAreaRef.current;
    if (!area) return;
  }, []);

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
          {items.map((doc) => (
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
              }}
              onClick={() => onOpenDocumentDetail(doc)}
              onMouseEnter={() => setHoveredDoc({ type, id: doc.id })}
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
                {hoveredDoc?.type === type && hoveredDoc?.id === doc.id ? (
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
                    onClick={(e) => onQuickRemove(doc, type, e)}
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
          ))}
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