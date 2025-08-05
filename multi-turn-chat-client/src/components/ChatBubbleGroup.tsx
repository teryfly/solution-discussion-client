import React, { useRef } from 'react';
import { Message } from '../types';
import CodeBlock from './CodeBlock';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { COLLAPSE_LENGTH } from '../config';

type MessageWithId = Message & { id?: number };

function isWaitingTyping(msg: Message) {
  return (
    msg.role === 'assistant' &&
    typeof msg.content === 'string' &&
    msg.content.startsWith('<span class="waiting-typing">')
  );
}

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        if (inline) {
          return <code className={className} {...props}>{children}</code>;
        }
        return (
          <CodeBlock
            language={match?.[1] || ''}
            code={String(children).replace(/\n$/, '')}
          />
        );
      },
    }}
  >
    {content}
  </ReactMarkdown>
);

// 分组时保留 index/id
export function groupMessages(messages: MessageWithId[]) {
  const groups: Array<{
    role: string,
    msgs: MessageWithId[],
    indices: number[],
    ids: (number | undefined)[]
  }> = [];
  let lastRole = '';
  let curr: { role: string, msgs: MessageWithId[], indices: number[], ids: (number | undefined)[] } | null = null;
  messages.forEach((msg, idx) => {
    if (!curr || msg.role !== lastRole) {
      curr = { role: msg.role, msgs: [msg], indices: [idx], ids: [msg.id] };
      groups.push(curr);
      lastRole = msg.role;
    } else {
      curr.msgs.push(msg);
      curr.indices.push(idx);
      curr.ids.push(msg.id);
    }
  });
  return groups;
}

interface ChatBubbleGroupProps {
  groups: ReturnType<typeof groupMessages>;
  bubbleRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
  onRightClick: (
    e: React.MouseEvent,
    groupIdx: number,
    msgIdx: number | null,
    group: { role: string; msgs: MessageWithId[]; indices: number[]; ids: (number | undefined)[] }
  ) => void;
  onToggle: (idx: number) => void;
}

const ChatBubbleGroup: React.FC<ChatBubbleGroupProps> = ({
  groups,
  bubbleRefs,
  onRightClick,
  onToggle,
}) => (
  <>
    {groups.map((group, groupIdx) => {
      if (group.msgs.length === 1) {
        const msg = group.msgs[0];
        return (
          <div
            key={groupIdx}
            className={`chat-msg ${msg.role}`}
            ref={(el) => {
              bubbleRefs.current[`${groupIdx}-0`] = el;
            }}
            onContextMenu={(e) => onRightClick(e, groupIdx, 0, group)}
            data-message-id={msg.id}
          >
            <div className="content">
              {msg.collapsed
                ? (typeof msg.content === 'string'
                    ? msg.content.slice(0, COLLAPSE_LENGTH)
                    : String(msg.content)) + '...[右键展开]'
                : isWaitingTyping(msg)
                ? <span dangerouslySetInnerHTML={{ __html: msg.content }} />
                : <MarkdownRenderer content={String(msg.content)} />}
            </div>
          </div>
        );
      }

      return (
        <div
          key={groupIdx}
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
          onContextMenu={(e) => {
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
            if (!found) {
              onRightClick(e, groupIdx, null, group);
            }
          }}
        >
          {group.msgs.map((msg, i) => (
            <div
              key={i}
              className={`chat-msg ${msg.role}`}
              ref={(el) => {
                bubbleRefs.current[`${groupIdx}-${i}`] = el;
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
              }}
              data-message-id={msg.id}
            >
              <div className="content">
                {msg.collapsed
                  ? (typeof msg.content === 'string'
                      ? msg.content.slice(0, COLLAPSE_LENGTH)
                      : String(msg.content)) + '...[右键展开]'
                  : isWaitingTyping(msg)
                  ? <span dangerouslySetInnerHTML={{ __html: msg.content }} />
                  : <MarkdownRenderer content={String(msg.content)} />}
              </div>
            </div>
          ))}
        </div>
      );
    })}
  </>
);

export default ChatBubbleGroup;