import React from 'react';
import { KnowledgeDocument } from '../../types';

export const DocList: React.FC<{
  loading: boolean;
  docs: KnowledgeDocument[];
  currentReferences: number[];
  categories: { id: number; name: string }[];
  onToggle: (id: number) => void;
  onEdit: (doc: KnowledgeDocument, e: React.MouseEvent) => void;
}> = ({ loading, docs, currentReferences, categories, onToggle, onEdit }) => {
  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: '#888', fontSize: 16 }}>加载中...</div>;
  }
  if (docs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#888', fontStyle: 'italic', fontSize: 16 }}>
        当前分类暂无文档
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
      {docs.map((doc) => {
        const isSelected = currentReferences.includes(doc.id);
        return (
          <div
            key={doc.id}
            onClick={() => onToggle(doc.id)}
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
              <div
                style={{
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
                }}
              >
                {isSelected && <span style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>✓</span>}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 16,
                    color: '#333',
                    marginBottom: 8,
                    wordBreak: 'break-word',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ flex: 1 }}>{doc.filename}</span>
                  <button
                    onClick={(e) => onEdit(doc, e)}
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
                <div
                  style={{
                    fontSize: 14,
                    color: '#666',
                    marginBottom: 12,
                    display: 'flex',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <span>ID: {doc.id}</span>
                  <span>分类: {categories.find((c) => c.id === doc.category_id)?.name || doc.category_id}</span>
                  <span>版本: v{doc.version}</span>
                  <span>创建: {new Date(doc.created_time).toLocaleDateString()}</span>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: '#888',
                    maxHeight: 60,
                    overflow: 'hidden',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {doc.content.length > 150 ? doc.content.slice(0, 150) + '...' : doc.content || '(无内容预览)'}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};