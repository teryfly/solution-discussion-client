// useMessages.ts
import { useState } from 'react';
import { getMessages } from '../api';
import { Message } from '../types';

export default function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);

  // 加载历史
  const loadMessages = async (conversationId: string) => {
    setMessages([{ role: 'system', content: '加载中...', collapsed: false }]);
    const history = await getMessages(conversationId);
    const collapsedHistory = history.map((msg, idx) => {
      const tooLong = msg.content.length > 100;
      return {
        ...msg,
        collapsed: idx < history.length - 2 && tooLong,
      };
    });
    setMessages(collapsedHistory);
    return collapsedHistory;
  };

  // 折叠
  const collapsePrevious = () => {
    setMessages((prev) => {
      const n = prev.length;
      return prev.map((msg, i) => 
        i < n - 2 && msg.content.length > 100
          ? { ...msg, collapsed: true }
          : msg
      );
    });
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

  return {
    messages,
    setMessages,
    loadMessages,
    collapsePrevious,
    toggleCollapse,
    copyMessage,
    saveMessage,
  };
}