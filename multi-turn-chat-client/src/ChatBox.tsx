// src/ChatBox.tsx
import React, { useState } from 'react';
import { Message } from './types';
import './App.css';
import ContextMenu, { MenuItem } from './ContextMenu';
import usePlanCategories from './hooks/usePlanCategories';

interface ChatBoxProps {
  messages: Message[];
  onToggle: (index: number) => void;
  onCopy: (text: string) => void;
  onSave: (text: string) => void;
  conversationMeta?: {
    projectId?: number;
    name?: string;
  };
}

const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onToggle,
  onCopy,
  onSave,
  conversationMeta,
}) => {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: MenuItem[];
  } | null>(null);

  const plan = usePlanCategories();

  // 发送到指定分类
  const handleSendTo = async (category_id: number, content: string) => {
    if (!conversationMeta?.projectId) {
      alert('会话未关联项目，无法发送');
      return;
    }
    try {
      // createPlanDocument 已经在 api.ts 实现
      const { createPlanDocument } = await import('./api');
      await createPlanDocument({
        project_id: conversationMeta.projectId,
        filename: conversationMeta.name || '未命名会话',
        category_id,
        content,
        version: 1,
        source: 'chat',
      });
      alert('文档已发送到该分类！');
    } catch (e: any) {
      alert('发送失败: ' + (e?.message || e));
    }
  };

  const handleRightClick = (
    e: React.MouseEvent,
    index: number,
    msg: Message
  ) => {
    e.preventDefault();

    const dynamicAction: MenuItem = msg.collapsed
      ? { label: '展开', onClick: () => onToggle(index) }
      : { label: '折叠', onClick: () => onToggle(index) };

    // 发送到菜单
    const sendToMenu: MenuItem = {
      label: '发送到',
      submenu: (plan.categories || []).map((cat) => ({
        label: cat.name,
        onClick: () => handleSendTo(cat.id, msg.content),
      })),
    };

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: '复制', onClick: () => onCopy(msg.content) },
        { label: '保存', onClick: () => onSave(msg.content) },
        sendToMenu,
        dynamicAction,
      ],
    });
  };

  return (
    <div>
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`chat-msg ${msg.role}`}
          onContextMenu={(e) => handleRightClick(e, index, msg)}
        >
          <div className="content">
            {msg.collapsed
              ? msg.content.split('\n')[0].slice(0, 60) + '...[右键展开]'
              : msg.content}
          </div>
        </div>
      ))}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default ChatBox;