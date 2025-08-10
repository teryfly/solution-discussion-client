// hooks/useConversations.ts
import { useEffect, useRef, useState } from 'react';
import useConversationList from './useConversationList';
import useMessages from './useMessages';
import useScroll from './useScroll';
import useInput from './useInput';
import { getModels, createConversation } from '../api';
import { ConversationMeta } from '../types';
const DEFAULT_SYSTEM_PROMPT = '你是一个通用助手，能够处理各种任务和问题。';
export default function useConversations({ chatBoxRef, params }: any) {
  const {
    conversationList,
    setConversationList, // ⭐️暴露出来
    refreshConversations,
    renameConversation,
    removeConversation,
    updateModel,
  } = useConversationList();
  const {
    messages,
    setMessages,
    loadMessages,
    collapsePrevious,
    toggleCollapse,
    copyMessage,
    saveMessage,
    appendMessage,
  } = useMessages();
  const { input, setInput } = useInput();
  const { scrollToBottom, scrollToTop } = useScroll(chatBoxRef);
  const [conversationId, setConversationId] = useState('');
  const [model, setModel] = useState('');
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const inputCache = useRef<Record<string, string>>({});
  useEffect(() => {
    getModels().then(setModelOptions);
    refreshConversations();
    if (params.conversationId) {
      setConversationId(params.conversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setInput('');
      return;
    }
    const found = conversationList.find((c) => c.id === conversationId);
    if (found) {
      setModel(found.model);
      loadMessages(found.id);
      scrollToBottom();
      if (Object.prototype.hasOwnProperty.call(inputCache.current, found.id)) {
        setInput(inputCache.current[found.id]);
      } else {
        setInput('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, conversationList]);
  const setConversationIdAndLoad = async (id: string) => {
    if (conversationId) {
      inputCache.current[conversationId] = input;
    }
    setConversationId(id);
  };
  const handleNewConversation = async (options: {
    name?: string;
    model: string;
    system?: string;
    project_id: number;
    project_name?: string;
    role?: string;
  }) => {
    const systemPrompt = options.system || DEFAULT_SYSTEM_PROMPT;
    const id = await createConversation(systemPrompt, options.project_id, options.name, options.model, options.role);
    const newMeta: ConversationMeta = {
      id,
      model: options.model,
      name: options.name,
      createdAt: new Date().toISOString(),
      projectId: options.project_id,
      projectName: options.project_name || '其它',
      assistanceRole: options.role || '通用助手',
    };
    // 新建会话插入到顶部
    setConversationList((prev) => [newMeta, ...prev]);
    await setConversationIdAndLoad(id);
  };
  const handleSelectConversation = async (id: string) => {
    await setConversationIdAndLoad(id);
  };
  const handleRenameConversation = (id: string, newName: string) => {
    renameConversation(id, newName);
  };
  const handleDeleteConversation = async (id: string) => {
    if (conversationId) {
      inputCache.current[conversationId] = input;
    }
    await refreshConversations();
    if (id === conversationId) {
      const updated = conversationList.filter((c) => c.id !== id);
      if (updated.length > 0) {
        await setConversationIdAndLoad(updated[0].id);
      } else {
        setMessages([]);
        setInput('');
        setConversationId('');
      }
    }
  };
  const handleModelChange = (id: string, newModel: string) => {
    updateModel(id, newModel);
    if (id === conversationId) setModel(newModel);
  };
  return {
    conversationId,
    setConversationId,
    setConversationList, // ⭐️暴露
    messages,
    setMessages,
    model,
    setModel,
    modelOptions,
    conversationList,
    refreshConversations,
    loadConversation: async (meta: ConversationMeta) => {
      if (conversationId) {
        inputCache.current[conversationId] = input;
      }
      setConversationId(meta.id);
    },
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
    appendMessage,
  };
}