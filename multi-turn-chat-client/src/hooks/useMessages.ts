// hooks/useMessages.ts
import { useState } from 'react';
import { getMessages } from '../api';
import { Message } from '../types';
import { trimAssistantReplay } from '../utils/trimAssistantReplay';
import { COLLAPSE_LENGTH } from '../config';

export default function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);

  // 加载历史
  const loadMessages = async (conversationId: string) => {
    setMessages([{ role: 'system', content: '加载中...', collapsed: false }]);
    const history = await getMessages(conversationId);
    // history: [{id, role, content, updated_at?}]
    // 折叠规则：如果只有一条消息，按长度折叠；如果多条消息，最后一条不折叠，其他按长度折叠
    const collapsedHistory = history.map((msg: any, index: number) => {
      const isLastMessage = index === history.length - 1;
      const isOnlyMessage = history.length === 1;
      const tooLong = msg.content.length > COLLAPSE_LENGTH;
      const content =
        msg.role === 'assistant' ? trimAssistantReplay(msg.content) : msg.content;
      // 折叠条件：消息过长 且 (只有一条消息 或 不是最后一条消息)
      const shouldCollapse = tooLong && (isOnlyMessage || !isLastMessage);
      return {
        id: msg.id,
        role: msg.role,
        content,
        collapsed: shouldCollapse,
        updated_at: msg.updated_at, // 保留后端更新时间
      } as Message;
    });
    setMessages(collapsedHistory);
    return collapsedHistory;
  };

  // 折叠全部（不常用，保留接口）
  const collapsePrevious = () => {
    setMessages((prev) =>
      prev.map((msg, index) => {
        const isLastMessage = index === prev.length - 1;
        const isOnlyMessage = prev.length === 1;
        const shouldCollapse = msg.content.length > COLLAPSE_LENGTH && (isOnlyMessage || !isLastMessage);
        return shouldCollapse ? { ...msg, collapsed: true } : msg;
      })
    );
  };

  // 展开/折叠切换
  const toggleCollapse = (index: number) => {
    setMessages((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        collapsed: !updated[index].collapsed,
      };
      return updated;
    });
  };

  // 复制消息
  const copyMessage = (content: string) => navigator.clipboard.writeText(content);

  // 保存消息
  const saveMessage = (content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'message.txt';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * 追加消息
   * @param msg 新消息
   * @param replaceLast 是否替换最后一条
   */
  const appendMessage = (msg: Message, replaceLast = false) => {
    setMessages(prev => {
      // 自动补充本地时间戳（仅当未提供时）
      const withTime: Message = {
        ...msg,
        updated_at: msg.updated_at || new Date().toISOString(),
      };

      if (replaceLast && prev.length > 0) {
        return [...prev.slice(0, -1), withTime];
      }

      // 去重替换用户消息（带ID）
      if (withTime.id && withTime.role === 'user') {
        const existingIndex = prev.findIndex(m =>
          m.role === 'user' &&
          m.content === withTime.content &&
          (!m.id || m.id === withTime.id)
        );
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = withTime;
          return updated;
        }
      }
      return [...prev, withTime];
    });
  };

  return {
    messages,
    setMessages,
    loadMessages,
    collapsePrevious,
    toggleCollapse,
    copyMessage,
    saveMessage,
    appendMessage,
  };
}