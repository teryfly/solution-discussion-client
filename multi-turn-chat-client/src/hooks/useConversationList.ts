// useConversationList.ts
import { useState } from 'react';
import { getProjects, getConversations } from '../api';
import { ConversationMeta } from '../types';
type Project = { id: number; name: string };
export default function useConversationList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [conversationList, setConversationList] = useState<ConversationMeta[]>([]);
  // 刷新项目列表（左侧列）
  const refreshProjects = async () => {
    const list = await getProjects();
    // 增加“其它”项目到顶部（id=0）
    const merged: Project[] = [{ id: 0, name: '其它' }, ...list.filter(p => p.id !== 0)];
    setProjects(merged);
    return merged;
  };
  // 按项目获取会话列表（status 默认 0）
  const refreshConversations = async (projectId: number = 0, status: number = 0) => {
    const raw = await getConversations({ project_id: projectId, status });
    // 建立 projectId->name 映射
    const projMap = new Map<number, string>(projects.map(p => [p.id, p.name]));
    const list: ConversationMeta[] = (raw || []).map((conv: any) => ({
      id: conv.id || conv.conversation_id, // 兼容字段
      name: conv.name || conv.system_prompt || '未命名会话',
      model: conv.model || 'default',
      createdAt: conv.created_at,
      projectId: conv.project_id,
      projectName: projMap.get(conv.project_id) || '其它',
      assistanceRole: conv.assistance_role,
    }));
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
    projects,
    setProjects,
    conversationList,
    setConversationList,
    refreshProjects,
    refreshConversations,
    renameConversation,
    removeConversation,
    updateModel,
  };
}