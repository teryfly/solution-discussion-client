// useConversations.ts
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useConversationList from './useConversationList';
import useMessages from './useMessages';
import useScroll from './useScroll';
import useInput from './useInput';
import { getModels, createConversation } from '../api';
import { Message, ConversationMeta } from '../types';

const DEFAULT_SYSTEM_PROMPT = '你是一个项目助手。';

export default function useConversations({ chatBoxRef, params, navigate }: any) {
  const { conversationList, setConversationList, refreshConversations, renameConversation, removeConversation, updateModel } = useConversationList();
  const { messages, setMessages, loadMessages, collapsePrevious, toggleCollapse, copyMessage, saveMessage } = useMessages();
  const { input, setInput } = useInput();
  const { scrollToBottom, scrollToTop } = useScroll(chatBoxRef);

  const [conversationId, setConversationId] = useState('');
  const [model, setModel] = useState('');
  const [modelOptions, setModelOptions] = useState<string[]>([]);

  // 初始加载模型和会话
  useEffect(() => {
    getModels().then(setModelOptions);
    refreshConversations();
    if (params.conversationId) {
      setConversationId(params.conversationId);
    }
    // eslint-disable-next-line
  }, []);

  // 路由变更后自动加载
  useEffect(() => {
    if (conversationId) {
      const found = conversationList.find(c => c.id === conversationId);
      if (found) loadConversation(found);
    }
    // eslint-disable-next-line
  }, [conversationId]);

  // 加载会话消息
  const loadConversation = async (meta: ConversationMeta) => {
    setConversationId(meta.id);
    setModel(meta.model);
    await loadMessages(meta.id);
    scrollToBottom();
  };

  const handleNewConversation = async (options: { name?: string; model: string; system?: string; project_id: number }) => {
    const systemPrompt = options.system || DEFAULT_SYSTEM_PROMPT;
    const id = await createConversation(
      systemPrompt,
      options.project_id,
      options.name,
      options.model
    );
    await refreshConversations();
    const newMeta = {
      id,
      model: options.model,
      name: options.name,
      createdAt: new Date().toISOString(),
      projectId: options.project_id,
      projectName: '其它',
    };
    loadConversation(newMeta);
  };

  const handleSelectConversation = async (id: string) => {
    const found = conversationList.find(c => c.id === id);
    if (found) await loadConversation(found);
  };

  const handleRenameConversation = (id: string, newName: string) => renameConversation(id, newName);

  const handleDeleteConversation = async (id: string) => {
    await refreshConversations();
    if (id === conversationId) {
      const updated = conversationList.filter(c => c.id !== id);
      if (updated.length > 0) loadConversation(updated[0]);
      else setMessages([]);
    }
  };

  const handleModelChange = (id: string, newModel: string) => {
    updateModel(id, newModel);
    if (id === conversationId) setModel(newModel);
  };

  return {
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
    collapsePrevious,
    toggleCollapse,
    copyMessage,
    saveMessage,
    scrollToBottom,
    scrollToTop,
  };
}