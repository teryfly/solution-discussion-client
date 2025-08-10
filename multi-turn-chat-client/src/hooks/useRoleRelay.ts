import { useState } from 'react';
import { createConversation } from '../api';
import { ROLE_CONFIGS } from '../config';
import { threadManager } from './useChatStream';
import { ConversationMeta, Message } from '../types';
export function useRoleRelay(
  currentMeta: ConversationMeta | undefined,
  modelOptions: string[],
  setConversationList: (fn: (prev: ConversationMeta[]) => ConversationMeta[]) => void,
  setConversationId: (id: string) => void,
  setMessages: (messages: Message[]) => void,
  appendMessage: (msg: Message, replaceLast?: boolean) => void
) {
  const [relayLock, setRelayLock] = useState(false);
  const [relayLoading, setRelayLoading] = useState(false);
  const handleRelayRole = async (relayRole: string, relayContent: string) => {
    if (relayLock) return;
    setRelayLock(true);
    try {
      const baseName = (currentMeta?.name || '未命名会话') + '转交';
      const projectId = currentMeta?.projectId || 0;
      const projectName = currentMeta?.projectName || '其它';
      const roleModel = ROLE_CONFIGS[relayRole]?.model || modelOptions[0] || '';
      const systemPrompt = ROLE_CONFIGS[relayRole]?.prompt || '';
      const convId = await createConversation(
        systemPrompt,
        projectId,
        baseName,
        roleModel,
        relayRole
      );
      const newMeta = {
        id: convId,
        model: roleModel,
        name: baseName,
        createdAt: new Date().toISOString(),
        projectId,
        projectName,
        assistanceRole: relayRole,
      };
      setConversationList((prev) => [...prev, newMeta]);
      setConversationId(convId);
      setMessages([]);
      setTimeout(() => {
        const thread = threadManager.createThread(convId, appendMessage, setRelayLoading);
        threadManager.setActiveThread(convId);
        thread.send(relayContent, roleModel);
      }, 80);
    } catch (e) {
      alert('转交会话失败: ' + ((e as any)?.message || e));
    } finally {
      setTimeout(() => setRelayLock(false), 500);
    }
  };
  return { handleRelayRole, relayLoading };
}