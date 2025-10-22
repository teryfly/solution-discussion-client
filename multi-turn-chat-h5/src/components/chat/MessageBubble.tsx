import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileCard } from './FileCard';
import { CodeDrawer } from './CodeDrawer';
import { PlantUMLDrawer } from './PlantUMLDrawer';
import { parseMessageContent } from '../../utils/messageParser';
import type { Message } from '../../types';
import type { ParsedBlock } from '../../utils/messageParser';
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
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(message.collapsed || false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<ParsedBlock | null>(null);

  const parsed = parseMessageContent(message.content);
  const isLongMessage = message.content.split('\n').length > 10;

  const handleLongPress = () => {
    setShowMenu(true);
  };

  const handleMenuAction = (action: () => void) => {
    setShowMenu(false);
    action();
  };

  const handleBlockClick = (block: ParsedBlock) => {
    if (block.type === 'markdown') {
      // Navigate to markdown preview page
      navigate('/markdown-preview', {
        state: { content: block.content },
      });
    } else {
      // Open drawer for code or UML
      setSelectedBlock(block);
    }
  };

  const renderContent = () => {
    if (message.role === 'user' || !parsed.hasBlocks) {
      return (
        <div className={`text-content ${collapsed ? 'collapsed' : ''}`}>
          {message.role === 'assistant' ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          ) : (
            message.content
          )}
        </div>
      );
    }

    // Assistant message with code blocks
    return (
      <div className="message-with-blocks">
        {parsed.textBefore && (
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {parsed.textBefore}
            </ReactMarkdown>
          </div>
        )}
        
        {parsed.blocks.map((block, index) => (
          <React.Fragment key={index}>
            <FileCard
              type={block.type === 'plantuml' ? 'uml' : block.type === 'markdown' ? 'markdown' : 'code'}
              language={block.language}
              lineCount={block.lineCount}
              title={block.title}
              onClick={() => handleBlockClick(block)}
            />
            {block.textAfter && (
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {block.textAfter}
                </ReactMarkdown>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
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
        {renderContent()}
        
        {isLongMessage && collapsed && !parsed.hasBlocks && (
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

      {selectedBlock && selectedBlock.type === 'plantuml' && (
        <PlantUMLDrawer
          code={selectedBlock.content}
          title={selectedBlock.title}
          onClose={() => setSelectedBlock(null)}
        />
      )}

      {selectedBlock && selectedBlock.type === 'code' && (
        <CodeDrawer
          code={selectedBlock.content}
          language={selectedBlock.language || 'text'}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  );
};