// src/pages/ConversationLayout/useConversationState.ts
import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import useConversations from '../../hooks/useConversations';
import useChatStream from '../../useChatStream';
import { ROLE_CONFIGS } from '../../config';

export default function useConversationState(chatBoxRef: React.RefObject<HTMLDivElement>) {
  const params = useParams();
  const location = useLocation();

  const {
    conversationId,
    setConversationId,
    messages,
    setMessages,
    model,
    setModel,
    modelOptions,
    conversationList,
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

  // 默认自动选中第一个会话
  useEffect(() => {
    if (!conversationId && conversationList.length > 0) {
      const grouped = conversationList.reduce((acc, conv) => {
        const key = conv.projectName || '其它';
        if (!acc[key]) acc[key] = [];
        acc[key].push(conv);
        return acc;
      }, {} as Record<string, typeof conversationList>);

      const firstProject = Object.keys(grouped)[0];
      const firstConv = grouped[firstProject]?.[0];
      if (firstConv) {
        handleSelectConversation(firstConv.id);
      }
    }
  }, [conversationId, conversationList]);

  const { send, loading } = useChatStream(conversationId, model, appendMessage);

  return {
    conversationId,
    currentMeta,
    conversationList,
    messages,
    model,
    modelOptions,
    input,
    loading,
    send,
    setInput,
    handleNewConversation,
    handleSelectConversation,
    handleRenameConversation,
    handleDeleteConversation,
    handleModelChange,
    toggleCollapse,
    copyMessage,
    saveMessage,
    scrollToBottom,
    scrollToTop,
    appendMessage,
  };
}
