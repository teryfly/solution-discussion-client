import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import useConversations from './useConversations';
import useChatStream, { threadManager } from './useChatStream';
import { useRoleRelay } from './useRoleRelay';
import { getConversationReferencedDocuments } from '../api';

export function useConversationLayout() {
  const params = useParams();
  const location = useLocation();
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [inputVisible, setInputVisible] = useState(true);
  const [showStop, setShowStop] = useState(false);
  const [documentIds, setDocumentIds] = useState<number[]>([]);

  const {
    projects,
    selectedProjectId,
    handleProjectSelect,
    conversationId,
    setConversationId,
    setConversationList,
    messages,
    setMessages,
    model,
    setModel,
    modelOptions,
    conversationList,
    refreshProjects,
    refreshConversations,
    loadConversation,
    handleNewConversation,
    handleSelectConversation,
    handleRenameConversation,
    handleDeleteConversation,
    handleModelChange,
    input,
    setInput,
    toggleCollapse,
    copyMessage,
    saveMessage,
    scrollToBottom,
    scrollToTop,
    appendMessage,
  } = useConversations({ chatBoxRef, params });

  const currentMeta = conversationList.find((c) => c.id === conversationId);

  // 加载当前会话的文档引用
  const loadDocumentReferences = async () => {
    if (!conversationId) {
      setDocumentIds([]);
      return;
    }

    try {
      const data = await getConversationReferencedDocuments(conversationId);
      const projectRefIds = (data.project_references || []).map((ref: any) => ref.document_id);
      const conversationRefIds = (data.conversation_references || []).map((ref: any) => ref.document_id);
      const allDocumentIds = [...projectRefIds, ...conversationRefIds];
      setDocumentIds(allDocumentIds);
    } catch (error) {
      console.error('加载文档引用失败:', error);
      setDocumentIds([]);
    }
  };

  // 当会话ID变化时，重新加载文档引用
  useEffect(() => {
    loadDocumentReferences();
  }, [conversationId]);

  // 提供获取文档ID的函数
  const getDocumentIds = () => documentIds;

  // 角色转交（保持原有功能）
  const { handleRelayRole } = useRoleRelay(
    currentMeta,
    modelOptions,
    setConversationList,
    setConversationId,
    setMessages,
    appendMessage
  );

  const { send, loading, setActiveConversation, stopStream } = useChatStream(
    conversationId,
    model,
    appendMessage,
    getDocumentIds // 传递获取文档ID的函数
  );

  // 设置活跃会话
  useEffect(() => {
    if (conversationId) {
      setActiveConversation();
    }
  }, [conversationId, setActiveConversation]);

  // 输入区域可见性控制
  useEffect(() => {
    if (loading) {
      setInputVisible(false);
      setShowStop(true);
    } else {
      setInputVisible(true);
      setShowStop(false);
    }
  }, [loading]);

  const handleConversationSelect = (id: string) => {
    handleSelectConversation(id);
    setTimeout(() => {
      if (threadManager) {
        threadManager.setActiveThread(id);
      }
    }, 100);
  };

  const handleStopClick = async () => {
    setShowStop(false);
    await stopStream?.();
  };

  const handleSendMessage = () => {
    if (input.trim() && !loading) {
      send(input);
      setInput('');
    }
  };

  return {
    // 项目
    projects,
    selectedProjectId,
    handleProjectSelect,
    // 状态
    conversationId,
    currentMeta,
    conversationList,
    messages,
    model,
    modelOptions,
    input,
    loading,
    inputVisible,
    showStop,
    location,
    // 方法
    setInput,
    handleNewConversation,
    handleConversationSelect,
    handleRenameConversation,
    handleDeleteConversation,
    handleModelChange,
    toggleCollapse,
    copyMessage,
    saveMessage,
    scrollToBottom,
    scrollToTop,
    appendMessage,
    handleRelayRole, // 保留并导出原有"转交角色"能力
    handleStopClick,
    handleSendMessage,
    setMessages,
    refreshProjects, // 新增：项目刷新方法
  };
}