// src/ChatBox.tsx
import React, { useState } from 'react';
import { Message } from './types';
import './App.css';
import ContextMenu, { MenuItem } from './ContextMenu';

interface ChatBoxProps {
  messages: Message[];
  onToggle: (index: number) => void;
  onCopy: (text: string) => void;
  onSave: (text: string) => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages, onToggle, onCopy, onSave }) => {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: MenuItem[];
  } | null>(null);

  const handleRightClick = (
    e: React.MouseEvent,
    index: number,
    msg: Message
  ) => {
    e.preventDefault();

    const dynamicAction: MenuItem = msg.collapsed
      ? { label: '展开', onClick: () => onToggle(index) }
      : { label: '折叠', onClick: () => onToggle(index) };

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: '复制', onClick: () => onCopy(msg.content) },
        { label: '保存', onClick: () => onSave(msg.content) },
        { label: '发送到', onClick: () => alert('暂未实现发送功能') },
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
