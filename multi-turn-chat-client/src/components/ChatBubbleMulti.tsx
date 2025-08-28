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

interface ChatBubbleMultiProps {
  groupIdx: number;
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
  copyAnimMap?: { [key: string]: boolean };
  triggerCopyAnim: (key: string) => void;
  COLLAPSE_LENGTH: number;
}

const ChatBubbleMulti: React.FC<ChatBubbleMultiProps> = ({
  groupIdx,
  group,
  bubbleRefs,
  onRightClick,
  onToggle,
  onCopy,
  onDelete,
  onRelay,
  onSendTo,
  copyAnimMap = {},
  triggerCopyAnim,
  COLLAPSE_LENGTH
}) => {
  const [visibleMsgIndex, setVisibleMsgIndex] = useState<number | null>(null);
  const [fixedMouseY, setFixedMouseY] = useState(0);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const msgRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const handleMouseEnter = (e: React.MouseEvent, msgIndex: number) => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (visibleMsgIndex !== msgIndex && msgRefs.current[msgIndex]) {
      const rect = msgRefs.current[msgIndex]!.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      setFixedMouseY(relativeY);
      showTimeoutRef.current = setTimeout(() => setVisibleMsgIndex(msgIndex), 1000);
    }
  };
  const handleMouseLeave = (e: React.MouseEvent) => {
    const target = e.relatedTarget as HTMLElement;
    if (target && target.closest('.bubble-actions')) return;
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setVisibleMsgIndex(null);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    };
  }, []);

  return (
    <div
      className={`chat-group-bubble ${group.role}`}
      style={{
        marginBottom: 18,
        borderRadius: 12,
        border: '1.5px solid #e3eaf2',
        padding: 10,
        position: 'relative',
        boxShadow: '0 2px 8px rgba(180,200,230,0.07)',
        maxWidth: group.role === 'user' ? '75%' : '78%',
        alignSelf: group.role === 'user' ? 'flex-end' : 'flex-start',
      }}
      onContextMenu={e => {
        let found = false;
        for (let i = 0; i < group.msgs.length; i++) {
          const refKey = `${groupIdx}-${i}`;
          if (
            bubbleRefs.current[refKey] &&
            bubbleRefs.current[refKey]?.contains(e.target as Node)
          ) {
            found = true;
            onRightClick(e, groupIdx, i, group);
            break;
          }
        }
        if (!found) onRightClick(e, groupIdx, null, group);
      }}
    >
      {group.msgs.map((msg: Message, i: number) => {
        const refKey = `${groupIdx}-${i}`;
        const content = (typeof msg.content === 'string' ? msg.content : String(msg.content)).trim();
        const lineCount = getLineCount(content);
        const showExpandIcon = lineCount > 1;
        const isVisible = visibleMsgIndex === i;
        const handleCopy = () => {
          copyToClipboard(content);
          if (onCopy) onCopy(content);
          triggerCopyAnim(refKey);
        };
        const handleToggle = () => onToggle(group.indices[i]);
        const anim = !!(copyAnimMap && copyAnimMap[refKey]);
        const isUser = msg.role === 'user';
        const timeText = formatTime(msg.updated_at);

        return (
          <div
            key={i}
            className={`chat-msg ${msg.role}`}
            ref={el => {
              bubbleRefs.current[refKey] = el;
              msgRefs.current[i] = el;
            }}
            style={{
              marginBottom: 10,
              background: msg.role === 'user'
                ? '#e8f0fe'
                : msg.role === 'assistant'
                  ? '#f1f3f4'
                  : '#f7f7f7',
              border: 'none',
              width: 'fit-content',
              maxWidth: '95%',
              position: 'relative',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => handleMouseEnter(e, i)}
            onMouseLeave={handleMouseLeave}
            data-message-id={msg.id}
          >
            <BubbleActions
              collapsed={!!msg.collapsed}
              onToggle={handleToggle}
              onCopy={handleCopy}
              copyAnim={anim}
              role={msg.role as 'user' | 'assistant'}
              isVisible={isVisible}
              mouseY={fixedMouseY}
              showExpandIcon={showExpandIcon}
            />
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
      })}
    </div>
  );
};

export default ChatBubbleMulti;