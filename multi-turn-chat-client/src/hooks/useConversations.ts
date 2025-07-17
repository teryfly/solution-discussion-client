// useConversations.ts
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useConversationList from './useConversationList';
import useMessages from './useMessages';
import useScroll from './useScroll';
import useInput from './useInput';
import { getModels, createConversation } from '../api';
import { Message, ConversationMeta } from '../types';

const DEFAULT_SYSTEM_PROMPT = '你是一个系统分析师，擅长帮助用户的优化关于软件设计方案的prompt。用户将输入一个软件设计需求/思路的 prompt, 请分析 prompt 的中的描述，判断需求是否明确、思路是否清晰、设计是否合理。如果有不明确、不清楚或不合理的地方就要求用户在下一轮对话中进一步解释、明确或更正。如果你有更好的建议或意见也请提出来让用户确认是否采纳。如果没有问题或建议，则输出优化后的完整版本的提示词（only prompt，nothing else), 以“设计一个XXX软件程序，从整体项目的结构，到每一个细节，输出一个开发设计文档，程序员将根据你输出的文档进行编码，这个文档是他编码工作的唯一信息来源。1、开发语言与环境 ...  2、功能要求...” 开头。';

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