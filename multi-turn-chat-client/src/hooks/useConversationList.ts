// useConversationList.ts
import { useState } from 'react';
import { getGroupedConversations } from '../api';
import { ConversationMeta } from '../types';

export default function useConversationList() {
  const [conversationList, setConversationList] = useState<ConversationMeta[]>([]);

  // 刷新会话列表
  const refreshConversations = async () => {
    const data = await getGroupedConversations();
    const list: ConversationMeta[] = [];
    for (const [projectName, conversations] of Object.entries(data)) {
      for (const conv of conversations as any[]) {
        list.push({
          id: conv.conversation_id,
          name: conv.name || conv.system_prompt || '未命名会话',
          model: conv.model || 'default',
          createdAt: conv.created_at,
          projectId: conv.project_id,
          projectName,
          // 关键点：直接使用后端的 assistance_role 字段（可能为 ""/null/undefined/具体角色名）
          assistanceRole: conv.assistance_role, 
        });
      }
    }
    setConversationList(list);
    return list;
  };

  // 重命名
  const renameConversation = (id: string, newName: string) => {
    setConversationList((prev) =>
      prev.map(conv => conv.id === id ? { ...conv, name: newName } : conv)
    );
  };

  // 删除（只前端过滤）
  const removeConversation = (id: string) => {
    setConversationList(prev => prev.filter(c => c.id !== id));
  };

  // 切换模型
  const updateModel = (id: string, newModel: string) => {
    setConversationList(prev =>
      prev.map(conv => conv.id === id ? { ...conv, model: newModel } : conv)
    );
  };

  return {
    conversationList,
    setConversationList,
    refreshConversations,
    renameConversation,
    removeConversation,
    updateModel,
  };
}