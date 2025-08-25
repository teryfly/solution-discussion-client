import React, { useState, useEffect } from 'react';
import { ConversationMeta, DocumentReference, KnowledgeDocument } from '../types';
import { 
  getConversationReferencedDocuments, 
  getProjectDocumentReferences,
  setProjectDocumentReferences,
  getConversationDocumentReferences,
  setConversationDocumentReferences
} from '../api';
import ProjectReferenceModal from './ProjectReferenceModal';
import ConversationReferenceModal from './ConversationReferenceModal';

interface KnowledgePanelProps {
  conversationId: string;
  currentMeta?: ConversationMeta;
  onRefresh?: () => void;
}

const KnowledgePanel: React.FC<KnowledgePanelProps> = ({
  conversationId,
  currentMeta,
  onRefresh,
}) => {
  const [projectReferences, setProjectReferences] = useState<DocumentReference[]>([]);
  const [conversationReferences, setConversationReferences] = useState<DocumentReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProjectReferenceModal, setShowProjectReferenceModal] = useState(false);
  const [showConversationReferenceModal, setShowConversationReferenceModal] = useState(false);
  const [hoveredDoc, setHoveredDoc] = useState<{ type: 'project' | 'conversation'; id: number } | null>(null);

  // 加载引用文档
  const loadReferencedDocuments = async () => {
    if (!conversationId) {
      setProjectReferences([]);
      setConversationReferences([]);
      return;
    }

    setLoading(true);
    try {
      const data = await getConversationReferencedDocuments(conversationId);
      setProjectReferences(data.project_references || []);
      setConversationReferences(data.conversation_references || []);
    } catch (error) {
      console.error('加载引用文档失败:', error);
      setProjectReferences([]);
      setConversationReferences([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferencedDocuments();
  }, [conversationId]);

  // 打开文档新页面
  const handleDocumentClick = (doc: DocumentReference) => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${doc.document_filename}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                line-height: 1.6;
                max-width: 1000px;
                margin: 0 auto;
                padding: 20px;
                background: #fff;
                color: #333;
              }
              .header {
                border-bottom: 2px solid #eee;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .title {
                font-size: 28px;
                font-weight: 600;
                margin: 0 0 10px 0;
                color: #1a73e8;
              }
              .meta {
                font-size: 14px;
                color: #666;
                display: flex;
                gap: 20px;
                flex-wrap: wrap;
              }
              .content {
                font-size: 16px;
                line-height: 1.7;
              }
              .content h1, .content h2, .content h3, .content h4, .content h5, .content h6 {
                margin-top: 30px;
                margin-bottom: 15px;
                font-weight: 600;
              }
              .content h1 { font-size: 24px; }
              .content h2 { font-size: 22px; }
              .content h3 { font-size: 20px; }
              .content h4 { font-size: 18px; }
              .content h5 { font-size: 16px; }
              .content h6 { font-size: 14px; }
              .content p { margin-bottom: 16px; }
              .content ul, .content ol { margin-bottom: 16px; padding-left: 30px; }
              .content li { margin-bottom: 8px; }
              .content blockquote {
                border-left: 4px solid #1a73e8;
                margin: 20px 0;
                padding: 10px 20px;
                background: #f8f9fa;
                color: #555;
              }
              .content code {
                background: #f5f5f5;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 14px;
              }
              .content pre {
                background: #f5f5f5;
                padding: 15px;
                border-radius: 6px;
                overflow-x: auto;
                margin: 20px 0;
              }
              .content pre code {
                background: none;
                padding: 0;
              }
              .content table {
                border-collapse: collapse;
                width: 100%;
                margin: 20px 0;
              }
              .content th, .content td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
              }
              .content th {
                background: #f8f9fa;
                font-weight: 600;
              }
              .content a {
                color: #1a73e8;
                text-decoration: none;
              }
              .content a:hover {
                text-decoration: underline;
              }
              @media (max-width: 768px) {
                body { padding: 15px; }
                .title { font-size: 24px; }
                .meta { flex-direction: column; gap: 10px; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">${doc.document_filename}</h1>
              <div class="meta">
                <span>文档ID: ${doc.document_id}</span>
                <span>版本: ${doc.document_version}</span>
                <span>创建时间: ${new Date(doc.document_created_time).toLocaleString()}</span>
              </div>
            </div>
            <div class="content" id="content"></div>
            <script>
              const content = ${JSON.stringify(doc.document_content || '')};
              const contentElement = document.getElementById('content');
              if (typeof marked !== 'undefined') {
                contentElement.innerHTML = marked.parse(content);
              } else {
                contentElement.innerHTML = '<pre>' + content + '</pre>';
              }
            </script>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  // 快捷删除引用 - 使用正确的逻辑
  const handleQuickRemove = async (doc: DocumentReference, type: 'project' | 'conversation', e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (type === 'project' && currentMeta?.projectId) {
        // 获取当前项目级引用
        const currentRefs = await getProjectDocumentReferences(currentMeta.projectId);
        const currentRefIds = currentRefs.map((ref: any) => ref.document_id);
        // 移除目标文档ID
        const newRefIds = currentRefIds.filter(id => id !== doc.document_id);
        // 重新设置项目级引用
        await setProjectDocumentReferences(currentMeta.projectId, newRefIds);
      } else if (type === 'conversation') {
        // 获取当前会话级引用
        const currentRefs = await getConversationDocumentReferences(conversationId);
        const currentRefIds = currentRefs.map((ref: any) => ref.document_id);
        // 移除目标文档ID
        const newRefIds = currentRefIds.filter(id => id !== doc.document_id);
        // 重新设置会话级引用
        await setConversationDocumentReferences(conversationId, newRefIds);
      }
      // 重新加载引用文档
      loadReferencedDocuments();
      onRefresh?.();
    } catch (error) {
      console.error('删除引用失败:', error);
    }
  };

  const handleRefreshReferences = () => {
    loadReferencedDocuments();
    onRefresh?.();
  };

  if (!conversationId) {
    return (
      <div style={{ 
        width: '120px', 
        borderLeft: '1px solid #ccc', 
        padding: '10px',
        background: '#f9f9fc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#888',
        fontSize: '14px'
      }}>
        请选择会话
      </div>
    );
  }

  return (
    <div style={{ 
      width: '120px', 
      borderLeft: '1px solid #ccc', 
      padding: '10px',
      background: '#f9f9fc',
      height: '100vh',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h4 style={{ 
        margin: '0 0 16px 0', 
        fontSize: '14px', 
        fontWeight: 'bold',
        color: '#333'
      }}>
        知识库
      </h4>

      {loading && (
        <div style={{ color: '#888', fontSize: '12px', textAlign: 'center' }}>
          加载中...
        </div>
      )}

      {!loading && (
        <>
          {/* 项目级引用 */}
          <div style={{ marginBottom: '20px' }}>
            <div 
              style={{ 
                fontSize: '13px', 
                fontWeight: '600', 
                marginBottom: '8px',
                cursor: 'pointer',
                color: '#1a73e8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onClick={() => setShowProjectReferenceModal(true)}
              title="点击编辑项目级引用"
            >
              <span>项目级引用</span>
              <span style={{ fontSize: '10px' }}>✏️</span>
            </div>
            
            {projectReferences.length === 0 ? (
              <div style={{ 
                fontSize: '11px', 
                color: '#888',
                fontStyle: 'italic',
                padding: '4px 0'
              }}>
                暂无引用
              </div>
            ) : (
              <div>
                {projectReferences.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      fontSize: '11px',
                      padding: '4px 6px',
                      marginBottom: '4px',
                      background: '#e8f0fe',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: '1px solid #d0e4ff',
                      wordBreak: 'break-word',
                      lineHeight: '1.3',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onClick={() => handleDocumentClick(doc)}
                    onMouseEnter={() => setHoveredDoc({ type: 'project', id: doc.id })}
                    onMouseLeave={() => setHoveredDoc(null)}
                    title={doc.document_filename}
                  >
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.document_filename.length > 15 
                        ? doc.document_filename.slice(0, 15) + '...'
                        : doc.document_filename
                      }
                    </span>
                    {hoveredDoc?.type === 'project' && hoveredDoc?.id === doc.id && (
                      <span
                        style={{
                          marginLeft: '4px',
                          color: '#f44336',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '0 2px',
                          borderRadius: '2px',
                          background: 'rgba(244, 67, 54, 0.1)'
                        }}
                        onClick={(e) => handleQuickRemove(doc, 'project', e)}
                        title="删除引用"
                      >
                        ×
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 会话级引用 */}
          <div>
            <div 
              style={{ 
                fontSize: '13px', 
                fontWeight: '600', 
                marginBottom: '8px',
                cursor: 'pointer',
                color: '#1a73e8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onClick={() => setShowConversationReferenceModal(true)}
              title="点击编辑会话级引用"
            >
              <span>会话级引用</span>
              <span style={{ fontSize: '10px' }}>✏️</span>
            </div>
            
            {conversationReferences.length === 0 ? (
              <div style={{ 
                fontSize: '11px', 
                color: '#888',
                fontStyle: 'italic',
                padding: '4px 0'
              }}>
                暂无引用
              </div>
            ) : (
              <div>
                {conversationReferences.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      fontSize: '11px',
                      padding: '4px 6px',
                      marginBottom: '4px',
                      background: '#f1f3f4',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: '1px solid #e0e0e0',
                      wordBreak: 'break-word',
                      lineHeight: '1.3',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onClick={() => handleDocumentClick(doc)}
                    onMouseEnter={() => setHoveredDoc({ type: 'conversation', id: doc.id })}
                    onMouseLeave={() => setHoveredDoc(null)}
                    title={doc.document_filename}
                  >
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.document_filename.length > 15 
                        ? doc.document_filename.slice(0, 15) + '...'
                        : doc.document_filename
                      }
                    </span>
                    {hoveredDoc?.type === 'conversation' && hoveredDoc?.id === doc.id && (
                      <span
                        style={{
                          marginLeft: '4px',
                          color: '#f44336',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          cursor: 'pointer',
                          padding: '0 2px',
                          borderRadius: '2px',
                          background: 'rgba(244, 67, 54, 0.1)'
                        }}
                        onClick={(e) => handleQuickRemove(doc, 'conversation', e)}
                        title="删除引用"
                      >
                        ×
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 项目级引用编辑弹窗 */}
      {showProjectReferenceModal && currentMeta?.projectId && (
        <ProjectReferenceModal
          visible={true}
          projectId={currentMeta.projectId}
          onClose={() => setShowProjectReferenceModal(false)}
          onUpdate={handleRefreshReferences}
        />
      )}

      {/* 会话级引用编辑弹窗 */}
      {showConversationReferenceModal && currentMeta?.projectId && (
        <ConversationReferenceModal
          visible={true}
          conversationId={conversationId}
          projectId={currentMeta.projectId}
          onClose={() => setShowConversationReferenceModal(false)}
          onUpdate={handleRefreshReferences}
        />
      )}
    </div>
  );
};

export default KnowledgePanel;