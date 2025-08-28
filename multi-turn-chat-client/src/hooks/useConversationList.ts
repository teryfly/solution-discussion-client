// useConversationList.ts
import { useState } from 'react';
import { getProjects, getConversations } from '../api';
import { ConversationMeta, Project } from '../types';

function toTimestamp(val?: string): number {
  if (!val) return 0;
  const t = Date.parse(val);
  return isNaN(t) ? 0 : t;
}

export default function useConversationList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [conversationList, setConversationList] = useState<ConversationMeta[]>([]);

  // 刷新项目列表（左侧列）
  const refreshProjects = async () => {
    const list = await getProjects();

    // 先按 updated_time 降序，其次按 created_time 降序，最后按 id 降序兜底
    const sorted = [...list].sort((a, b) => {
      const ua = toTimestamp(a.updated_time || a.updated_time as any);
      const ub = toTimestamp(b.updated_time || b.updated_time as any);
      if (ub !== ua) return ub - ua;

      const ca = toTimestamp(a.created_time || a.created_time as any);
      const cb = toTimestamp(b.created_time || b.created_time as any);
      if (cb !== ca) return cb - ca;

      return (b.id || 0) - (a.id || 0);
    });

    // 增加"其它"项目（id=0），并将其始终放到最后
    const merged: Project[] = [
      ...sorted.filter(p => p.id !== 0),
      { id: 0, name: '其它' } as Project,
    ];

    setProjects(merged);
    return merged;
  };

  // 按项目获取会话列表（status 默认 0）
  const refreshConversations = async (projectId: number = 0, status: number = 0) => {
    const raw = await getConversations({ project_id: projectId, status });
    // 建立 projectId->name 映射（projects 可能尚未刷新完成，临时从当前state读取）
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