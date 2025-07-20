// hooks/useConversations.ts
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useConversationList from './useConversationList';
import useMessages from './useMessages';
import useScroll from './useScroll';
import useInput from './useInput';
import { getModels, createConversation } from '../api';
import { Message, ConversationMeta } from '../types';

const DEFAULT_SYSTEM_PROMPT = '你是一个通用助手，能够处理各种任务和问题。';

export default function useConversations({ chatBoxRef, params, navigate }: any) {
  const {
    conversationList,
    setConversationList,
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
  } = useMessages();

  const { input, setInput } = useInput();
  const { scrollToBottom, scrollToTop } = useScroll(chatBoxRef);

  const [conversationId, setConversationId] = useState('');
  const [model, setModel] = useState('');
  const [modelOptions, setModelOptions] = useState<string[]>([]);

  // ✅ 缓存每个会话的输入内容
  const inputCache = useRef<Record<string, string>>({});

  // 初始加载模型 & 会话列表
  useEffect(() => {
    getModels().then(setModelOptions);
    refreshConversations();
    if (params.conversationId) {
      setConversationId(params.conversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 会话ID变更时，自动加载消息和回填输入内容
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

      // ✅ 切换时自动回填缓存输入，没有则清空
      if (Object.prototype.hasOwnProperty.call(inputCache.current, found.id)) {
        setInput(inputCache.current[found.id]);
      } else {
        setInput('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, conversationList]);

  // 设置当前会话并保存前一个的输入内容
  const setConversationIdAndLoad = async (id: string) => {
    if (conversationId) {
      inputCache.current[conversationId] = input; // ✅ 保存旧的输入内容
    }
    setConversationId(id);
    // 后续加载放到 useEffect
  };

  // === 修正点：projectName 由 options.project_name 传入 ===
  const handleNewConversation = async (options: {
    name?: string;
    model: string;
    system?: string;
    project_id: number;
    project_name?: string; // 新增，见 NewConversationModal
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
      projectName: options.project_name || '其它',  // ★★★ 这里用真实项目名 ★★★
      assistanceRole: options.role || '通用助手',
    };

    setConversationList((prev) => [...prev, newMeta]);
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
  };
}