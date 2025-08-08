import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import BubbleActions from './BubbleActions';
import MarkdownRenderer from './MarkdownRenderer';

function isWaitingTyping(msg: Message) {
  return (
    msg.role === 'assistant' &&
    typeof msg.content === 'string' &&
    msg.content.startsWith('<span class="waiting-typing">')
  );
}

function getLineCount(content: string | undefined): number {
  if (!content) return 0;
  return content.split('\n').length;
}

function copyToClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
    return Promise.resolve();
  }
}

interface ChatBubbleSingleProps {
  groupIdx: number;
  msg: Message;
  idxInGroup: number;
  group: any;
  bubbleRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  onRightClick: (
    e: React.MouseEvent,
    groupIdx: number,
    msgIdx: number | null,
    group: any
  ) => void;
  onToggle: (idx: number) => void;
  onCopy?: (text: string) => void;
  copyAnim?: boolean;
  triggerCopyAnim: (key: string) => void;
  COLLAPSE_LENGTH: number;
}

const ChatBubbleSingle: React.FC<ChatBubbleSingleProps> = ({
  groupIdx,
  msg,
  idxInGroup,
  group,
  bubbleRefs,
  onRightClick,
  onToggle,
  onCopy,
  copyAnim,
  triggerCopyAnim,
  COLLAPSE_LENGTH
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [fixedMouseY, setFixedMouseY] = useState(0);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  
  const bubbleKey = `${groupIdx}-${idxInGroup}`;
  const content = typeof msg.content === 'string' ? msg.content : String(msg.content);
  const lineCount = getLineCount(content);
  const showExpandIcon = lineCount > 1; // 只有多行才显示展开/折叠图标

  const handleCopy = () => {
    copyToClipboard(content);
    if (onCopy) onCopy(content);
    triggerCopyAnim(bubbleKey);
  };
  const handleToggle = () => {
    onToggle(group.indices[0]);
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    // 清除隐藏定时器
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    
    // 只有在图标不可见时才重新计算位置和设置显示定时器
    if (!isVisible && bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      setFixedMouseY(relativeY);
      
      // 1秒后显示图标
      showTimeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
    }
    
    setIsHovered(true);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    // 检查是否移动到了图标区域
    const target = e.relatedTarget as HTMLElement;
    if (target && target.closest('.bubble-actions')) {
      return; // 如果移动到图标区域，不触发离开
    }
    
    setIsHovered(false);
    
    // 清除显示定时器
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    
    // 1秒后隐藏图标
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 1000);
  };

  // 处理图标区域的鼠标事件
  const handleActionsMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    setIsVisible(true);
  };

  const handleActionsMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    bubbleRefs.current[bubbleKey] = bubbleRef.current;
  }, [bubbleKey, bubbleRefs]);

  return (
    <div
      className={`chat-msg ${msg.role}`}
      ref={bubbleRef}
      style={{ 
        position: 'relative',
        transition: 'all 0.2s ease'
      }}
      onContextMenu={e => onRightClick(e, groupIdx, 0, group)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-message-id={msg.id}
    >
      <div 
        onMouseEnter={handleActionsMouseEnter}
        onMouseLeave={handleActionsMouseLeave}
        style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
      >
        <BubbleActions
          collapsed={!!msg.collapsed}
          onToggle={handleToggle}
          onCopy={handleCopy}
          copyAnim={!!copyAnim}
          role={msg.role as 'user' | 'assistant'}
          isVisible={isVisible}
          mouseY={fixedMouseY}
          showExpandIcon={showExpandIcon}
        />
      </div>
      
      <div className="content">
        {msg.collapsed
          ? (typeof msg.content === 'string'
              ? msg.content.slice(0, COLLAPSE_LENGTH)
              : String(msg.content)) + '...[右击展开]'
          : isWaitingTyping(msg)
          ? <span dangerouslySetInnerHTML={{ __html: msg.content }} />
          : <MarkdownRenderer content={String(msg.content)} />}
      </div>
    </div>
  );
};

export default ChatBubbleSingle;