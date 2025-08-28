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
function formatTime(iso?: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${mm}-${dd} ${hh}:${mi}`;
  } catch {
    return '';
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
  onDelete?: (indices: number[]) => void;
  onRelay?: (role: string, content: string) => void;
  onSendTo?: (categoryId: number, categoryName: string, content: string) => void;
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
  onDelete,
  onRelay,
  onSendTo,
  copyAnim,
  triggerCopyAnim,
  COLLAPSE_LENGTH
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [fixedMouseY, setFixedMouseY] = useState(0);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const bubbleKey = `${groupIdx}-${idxInGroup}`;
  const content = (typeof msg.content === 'string' ? msg.content : String(msg.content)).trim();
  const lineCount = getLineCount(content);
  const showExpandIcon = lineCount > 1;

  const handleCopy = () => {
    copyToClipboard(content);
    if (onCopy) onCopy(content);
    triggerCopyAnim(bubbleKey);
  };
  const handleToggle = () => onToggle(group.indices[0]);
  const handleMouseEnter = (e: React.MouseEvent) => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (!isVisible && bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      setFixedMouseY(relativeY);
      showTimeoutRef.current = setTimeout(() => setIsVisible(true), 1000);
    }
  };
  const handleMouseLeave = (e: React.MouseEvent) => {
    const target = e.relatedTarget as HTMLElement;
    if (target && target.closest('.bubble-actions')) return;
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setIsVisible(false), 1000);
  };
  const handleActionsMouseEnter = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    setIsVisible(true);
  };
  const handleActionsMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => setIsVisible(false), 1000);
  };

  useEffect(() => {
    bubbleRefs.current[bubbleKey] = bubbleRef.current;
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    };
  }, [bubbleKey, bubbleRefs]);

  const isUser = msg.role === 'user';
  const timeText = formatTime(msg.updated_at);

  return (
    <div
      className={`chat-msg ${msg.role}`}
      ref={bubbleRef}
      style={{ position: 'relative', transition: 'all 0.2s ease' }}
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
          ? content.slice(0, COLLAPSE_LENGTH) + '...[右击展开]'
          : isWaitingTyping(msg)
            ? <span dangerouslySetInnerHTML={{ __html: msg.content }} />
            : <MarkdownRenderer content={content} />}
      </div>
      {timeText && (
        <div
          style={{
            fontSize: 10,
            color: '#888',
            marginTop: 4,
            textAlign: isUser ? 'right' : 'left'
          }}
        >
          {timeText}
        </div>
      )}
    </div>
  );
};

export default ChatBubbleSingle;