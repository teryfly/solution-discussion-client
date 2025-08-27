import React, { useState, useEffect, useRef } from 'react';
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
import DocumentDetailModal from './DocumentDetailModal';

interface LogEntry {
  id: string;
  message: string;
  type: string;
  timestamp: string;
  data?: any;
}

interface KnowledgePanelProps {
  conversationId: string;
  currentMeta?: ConversationMeta;
  onRefresh?: () => void;
  executionLogs: LogEntry[];
  onClearLogs?: () => void;
  lastExecutionSummary?: any;
  autoUpdateCode: boolean;
  onAutoUpdateCodeChange: (checked: boolean) => void;
}

const KnowledgePanel: React.FC<KnowledgePanelProps> = ({
  conversationId,
  currentMeta,
  onRefresh,
  executionLogs,
  onClearLogs,
  lastExecutionSummary,
  autoUpdateCode,
  onAutoUpdateCodeChange,
}) => {
  const [projectReferences, setProjectReferences] = useState<DocumentReference[]>([]);
  const [conversationReferences, setConversationReferences] = useState<DocumentReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProjectReferenceModal, setShowProjectReferenceModal] = useState(false);
  const [showConversationReferenceModal, setShowConversationReferenceModal] = useState(false);
  const [hoveredDoc, setHoveredDoc] = useState<{ type: 'project' | 'conversation'; id: number } | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentReference | null>(null);
  const [showDocumentDetailModal, setShowDocumentDetailModal] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const knowledgeAreaRef = useRef<HTMLDivElement>(null);

  // 自动滚动到日志底部
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [executionLogs]);

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
      // 按ID倒序排序项目级引用
      const sortedProjectRefs = (data.project_references || []).sort((a, b) => b.document_id - a.document_id);
      // 按ID倒序排序会话级引用
      const sortedConversationRefs = (data.conversation_references || []).sort((a, b) => b.document_id - a.document_id);
      
      setProjectReferences(sortedProjectRefs);
      setConversationReferences(sortedConversationRefs);
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

  // 打开文档详情弹窗
  const handleDocumentClick = (doc: DocumentReference) => {
    setSelectedDocument(doc);
    setShowDocumentDetailModal(true);
  };

  // 处理文档ID变更（编辑后创建新版本）
  const handleDocumentChange = async (newDocumentId: number) => {
    if (!selectedDocument) return;

    try {
      const oldDocumentId = selectedDocument.document_id;
      
      // 根据文档类型更新引用关系
      if (projectReferences.some(ref => ref.document_id === oldDocumentId)) {
        // 项目级引用
        if (currentMeta?.projectId) {
          const currentRefs = await getProjectDocumentReferences(currentMeta.projectId);
          const currentRefIds = currentRefs.map((ref: any) => ref.document_id);
          // 替换旧ID为新ID
          const newRefIds = currentRefIds.map(id => id === oldDocumentId ? newDocumentId : id);
          await setProjectDocumentReferences(currentMeta.projectId, newRefIds);
        }
      } else if (conversationReferences.some(ref => ref.document_id === oldDocumentId)) {
        // 会话级引用
        const currentRefs = await getConversationDocumentReferences(conversationId);
        const currentRefIds = currentRefs.map((ref: any) => ref.document_id);
        // 替换旧ID为新ID
        const newRefIds = currentRefIds.map(id => id === oldDocumentId ? newDocumentId : id);
        await setConversationDocumentReferences(conversationId, newRefIds);
      }

      // 重新加载引用文档
      await loadReferencedDocuments();
      onRefresh?.();
    } catch (error) {
      console.error('更新文档引用关系失败:', error);
      alert('更新文档引用关系失败: ' + (error as any)?.message);
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

  // 获取日志类型对应的样式
  const getLogTypeStyle = (type: string) => {
    switch (type) {
      case 'error':
        return { color: '#f44336', fontWeight: 'bold' };
      case 'warning':
        return { color: '#ff9800', fontWeight: 'bold' };
      case 'summary':
        return { color: '#9c27b0', fontWeight: 'bold' };
      default:
        return { color: '#666' };
    }
  };

  // 格式化时间戳
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  // 精简执行摘要显示：成功X, 失败Y, 无效Z
  const formatExecutionSummary = (summary: any) => {
    if (!summary) return '';
    const successful = Number(summary.successful_tasks ?? 0);
    const failed = Number(summary.failed_tasks ?? 0);
    const invalid = Number(summary.invalid_tasks ?? 0);
    return `成功${successful}, 失败${failed}, 无效${invalid}`;
  };

  // 处理日志显示内容，确保error和warning类型与WriteSourceCodeModal一致
  const getLogDisplayContent = (log: LogEntry) => {
    if (log.type === 'summary' && typeof log.data === 'object' && log.data) {
      return formatExecutionSummary(log.data);
    }
    
    // 对于error和warning类型，直接显示message，与WriteSourceCodeModal保持一致
    if (log.type === 'error' || log.type === 'warning') {
      return log.message;
    }
    
    return typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : log.data || log.message;
  };

  // 复制日志功能
  const handleCopyLogs = async () => {
    if (executionLogs.length === 0) {
      alert('暂无日志可复制');
      return;
    }

    try {
      const logText = executionLogs.map(log => {
        const timestamp = formatTimestamp(log.timestamp);
        const content = getLogDisplayContent(log);
        return `[${timestamp}] ${log.type.toUpperCase()}: ${content}`;
      }).join('\n');

      await navigator.clipboard.writeText(logText);
      // 简单的视觉反馈 - 暂时改变按钮文本
      const button = document.querySelector('.execution-logs-copy-btn') as HTMLButtonElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = '已复制';
        button.style.background = '#4caf50';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = '';
        }, 1000);
      }
    } catch (error) {
      console.error('复制日志失败:', error);
      alert('复制日志失败，请重试');
    }
  };

  if (!conversationId) {
    return (
      <div style={{ 
        width: '200px', 
        borderLeft: '1px solid #ccc', 
        padding: '10px',
        background: '#f9f9fc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#888',
        fontSize: '14px',
        height: '100vh'
      }}>
        请选择会话
      </div>
    );
  }

  return (
    <div style={{ 
      width: '200px', 
      borderLeft: '1px solid #ccc', 
      background: '#f9f9fc',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden' // 防止整体滚动
    }}>
      {/* D1: 知识库引用区域 - 高度根据内容动态调整 */}
      <div 
        ref={knowledgeAreaRef}
        style={{
          padding: '10px',
          overflow: 'auto',
          borderBottom: '1px solid #ddd',
          flexShrink: 0, // 不压缩
          maxHeight: '60vh' // 最大高度限制，避免占用太多空间
        }}
      >
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
                      }}
                      onClick={() => handleDocumentClick(doc)}
                      onMouseEnter={() => setHoveredDoc({ type: 'project', id: doc.id })}
                      onMouseLeave={() => setHoveredDoc(null)}
                      title={`${doc.document_filename} (v${doc.document_version})`}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between' 
                      }}>
                        <span style={{ 
                          flex: 1, 
                          minWidth: 0, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          marginRight: '4px'
                        }}>
                          {doc.document_filename.length > 15 
                            ? doc.document_filename.slice(0, 15) + '...'
                            : doc.document_filename
                          }
                        </span>
                        {hoveredDoc?.type === 'project' && hoveredDoc?.id === doc.id ? (
                          <span
                            style={{
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
                        ) : (
                          <span style={{ 
                            fontSize: '10px', 
                            color: '#666',
                            fontStyle: 'italic',
                            flexShrink: 0
                          }}>
                            v{doc.document_version}
                          </span>
                        )}
                      </div>
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
                      }}
                      onClick={() => handleDocumentClick(doc)}
                      onMouseEnter={() => setHoveredDoc({ type: 'conversation', id: doc.id })}
                      onMouseLeave={() => setHoveredDoc(null)}
                      title={`${doc.document_filename} (v${doc.document_version})`}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between' 
                      }}>
                        <span style={{ 
                          flex: 1, 
                          minWidth: 0, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          marginRight: '4px'
                        }}>
                          {doc.document_filename.length > 15 
                            ? doc.document_filename.slice(0, 15) + '...'
                            : doc.document_filename
                          }
                        </span>
                        {hoveredDoc?.type === 'conversation' && hoveredDoc?.id === doc.id ? (
                          <span
                            style={{
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
                        ) : (
                          <span style={{ 
                            fontSize: '10px', 
                            color: '#666',
                            fontStyle: 'italic',
                            flexShrink: 0
                          }}>
                            v{doc.document_version}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* D2: 执行日志区域 - 占用剩余空间，内容滚动 */}
      <div style={{
        flex: 1, // 占用剩余所有空间
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0, // 允许收缩
        overflow: 'hidden' // 防止溢出
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          flexShrink: 0 // 标题行不收缩
        }}>
          <h4 style={{ 
            margin: 0, 
            fontSize: '14px', 
            fontWeight: 'bold',
            color: '#333'
          }}>
            日志
          </h4>
          
          {/* 自动更新代码复选框 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '11px',
            color: '#666',
            gap: '4px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                checked={autoUpdateCode}
                onChange={(e) => onAutoUpdateCodeChange(e.target.checked)}
                style={{ margin: 0, cursor: 'pointer' }}
              />
              <span>自动更新代码</span>
            </label>
          </div>

          {executionLogs.length > 0 && (
            <button
              className="execution-logs-copy-btn"
              onClick={handleCopyLogs}
              style={{
                background: 'none',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '2px 4px',
                fontSize: '12px',
                cursor: 'pointer',
                color: '#666',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="复制日志"
            >
              📋
            </button>
          )}
        </div>

        {/* 日志容器 - 可滚动 */}
        <div
          ref={logContainerRef}
          style={{
            flex: 1, // 占用剩余空间
            overflow: 'auto', // 内容过多时滚动
            fontFamily: 'monospace',
            fontSize: '10px',
            lineHeight: 1.4,
            background: '#fafafa',
            border: '1px solid #eee',
            borderRadius: '4px',
            padding: '6px',
            minHeight: 0 // 允许收缩
          }}
        >
          {executionLogs.length === 0 ? (
            <div style={{ color: '#999', textAlign: 'center', marginTop: '20px', fontSize: '11px' }}>
              暂无执行日志
            </div>
          ) : (
            executionLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  marginBottom: '8px',
                  padding: '6px',
                  background: '#fff',
                  borderRadius: '4px',
                  border: '1px solid #eee',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontSize: '9px', color: '#999' }}>
                    {formatTimestamp(log.timestamp)}
                  </span>
                  <span style={{
                    ...getLogTypeStyle(log.type),
                    fontSize: '9px',
                    textTransform: 'uppercase'
                  }}>
                    {log.type}
                  </span>
                </div>
                <div style={{ fontSize: '10px', wordBreak: 'break-word' }}>
                  {getLogDisplayContent(log)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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

      {/* 文档详情弹窗 */}
      {showDocumentDetailModal && selectedDocument && (
        <DocumentDetailModal
          visible={true}
          document={selectedDocument}
          onClose={() => {
            setShowDocumentDetailModal(false);
            setSelectedDocument(null);
          }}
          onUpdate={handleRefreshReferences}
          onDocumentChange={handleDocumentChange}
        />
      )}
    </div>
  );
};

export default KnowledgePanel;