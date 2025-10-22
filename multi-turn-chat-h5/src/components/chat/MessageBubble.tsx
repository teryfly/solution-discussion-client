import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../../types';
import '../../styles/MessageBubble.css';

interface MessageBubbleProps {
  message: Message;
  onCopy?: () => void;
  onDelete?: () => void;
  onRegenerate?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onCopy,
  onDelete,
  onRegenerate,
}) => {
  const [collapsed, setCollapsed] = useState(message.collapsed || false);
  const [showMenu, setShowMenu] = useState(false);

  const isLongMessage = message.content.split('\n').length > 10;

  const handleLongPress = () => {
    setShowMenu(true);
  };

  const handleMenuAction = (action: () => void) => {
    setShowMenu(false);
    action();
  };

  return (
    <div className={`message-bubble ${message.role}`}>
      <div
        className="message-content"
        onContextMenu={(e) => {
          e.preventDefault();
          handleLongPress();
        }}
      >
        {message.role === 'assistant' ? (
          <div className={`markdown-content ${collapsed ? 'collapsed' : ''}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-content">{message.content}</div>
        )}
        
        {isLongMessage && collapsed && (
          <button
            className="expand-btn"
            onClick={() => setCollapsed(false)}
          >
            展开全部
          </button>
        )}
      </div>

      <div className="message-time">
        {new Date(message.created_at || '').toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>

      {showMenu && (
        <div className="message-menu-overlay" onClick={() => setShowMenu(false)}>
          <div className="message-menu" onClick={(e) => e.stopPropagation()}>
            {onCopy && (
              <button onClick={() => handleMenuAction(onCopy)}>
                📋 复制消息
              </button>
            )}
            {message.role === 'assistant' && onRegenerate && (
              <button onClick={() => handleMenuAction(onRegenerate)}>
                🔄 重新生成
              </button>
            )}
            {onDelete && (
              <button onClick={() => handleMenuAction(onDelete)}>
                🗑️ 删除消息
              </button>
            )}
            <button onClick={() => setShowMenu(false)}>
              ❌ 取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};