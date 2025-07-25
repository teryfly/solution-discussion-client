import React, { useState, useRef } from 'react';
import { Message } from './types';
import './App.css';
import ContextMenu, { MenuItem } from './ContextMenu';
import usePlanCategories from './hooks/usePlanCategories';
import { COLLAPSE_LENGTH, ROLE_CONFIGS } from './config';
import CodeBlock from './components/CodeBlock';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function isWaitingTyping(msg: Message) {
  return (
    msg.role === 'assistant' &&
    typeof msg.content === 'string' &&
    msg.content.startsWith('<span class="waiting-typing">')
  );
}

function getFullContent(msg: Message): string {
  if (typeof msg.content === 'string') {
    return isWaitingTyping(msg)
      ? msg.content.replace(/<[^>]+>/g, '')
      : msg.content;
  }
  return String(msg.content);
}

function trimEndLines(text: string): string {
  const lines = text.split('\n');
  let end = lines.length - 1;
  while (end >= 0 && (lines[end].trim() === '' || lines[end].trim() === '------')) {
    end--;
  }
  return lines.slice(0, end + 1).join('\n');
}

function groupMessages(messages: Message[]) {
  const groups: Array<{
    role: string,
    msgs: Message[],
    indices: number[],
  }> = [];
  let lastRole = '';
  let curr: { role: string, msgs: Message[], indices: number[] } | null = null;

  messages.forEach((msg, idx) => {
    if (!curr || msg.role !== lastRole) {
      curr = { role: msg.role, msgs: [msg], indices: [idx] };
      groups.push(curr);
      lastRole = msg.role;
    } else {
      curr.msgs.push(msg);
      curr.indices.push(idx);
    }
  });
  return groups;
}

// Markdown 渲染组件，内嵌 CodeBlock 支持
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
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
};

interface ChatBoxProps {
  messages: Message[];
  onToggle: (index: number) => void;
  onCopy: (text: string) => void;
  onSave: (text: string) => void;
  conversationMeta?: {
    projectId?: number;
    name?: string;
  };
  onRelayRole?: (role: string, content: string) => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onToggle,
  onCopy,
  onSave,
  conversationMeta,
  onRelayRole,
}) => {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: MenuItem[];
  } | null>(null);

  const plan = usePlanCategories();
  const bubbleRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleSendTo = async (category_id: number, content: string) => {
    if (!conversationMeta?.projectId) {
      alert('会话未关联项目，无法发送');
      return;
    }
    try {
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
    groupIdx: number,
    msgIdx: number | null,
    group: { role: string; msgs: Message[]; indices: number[] }
  ) => {
    e.preventDefault();

    const relayMenu: MenuItem = {
      label: '转交角色...',
      submenu: Object.keys(ROLE_CONFIGS).map(role => ({
        label: role,
        onClick: () => {
          let relayContent = '';
          if (msgIdx !== null && group.msgs[msgIdx]) {
            relayContent = getFullContent(group.msgs[msgIdx]);
          } else {
            relayContent = group.msgs
              .map((msg) => trimEndLines(getFullContent(msg)))
              .join('\n------\n');
          }
          onRelayRole?.(role, relayContent);
        }
      }))
    };

    if (msgIdx !== null && group.msgs[msgIdx]) {
      const idx = group.indices[msgIdx];
      const msg = group.msgs[msgIdx];

      const dynamicAction: MenuItem = msg.collapsed
        ? { label: '展开', onClick: () => onToggle(idx) }
        : { label: '折叠', onClick: () => onToggle(idx) };

      const sendToMenu: MenuItem = {
        label: '发送到',
        submenu: (plan.categories || []).map((cat) => ({
          label: cat.name,
          onClick: () => handleSendTo(cat.id, getFullContent(msg)),
        })),
      };

      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        items: [
          relayMenu,
          { label: '复制', onClick: () => onCopy(getFullContent(msg)) },
          { label: '保存', onClick: () => onSave(getFullContent(msg)) },
          sendToMenu,
          dynamicAction,
        ],
      });
    } else {
      const allContent = group.msgs
        .map((msg) => trimEndLines(getFullContent(msg)))
        .join('\n------\n');

      const sendToMenu: MenuItem = {
        label: '发送到',
        submenu: (plan.categories || []).map((cat) => ({
          label: cat.name,
          onClick: () => handleSendTo(cat.id, allContent),
        })),
      };

      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        items: [
          relayMenu,
          { label: '复制', onClick: () => onCopy(allContent) },
          { label: '保存', onClick: () => onSave(allContent) },
          sendToMenu,
        ],
      });
    }
  };

  const groups = groupMessages(messages);

  return (
    <div>
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
              onContextMenu={(e) => handleRightClick(e, groupIdx, 0, group)}
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
                  handleRightClick(e, groupIdx, i, group);
                  break;
                }
              }
              if (!found) {
                handleRightClick(e, groupIdx, null, group);
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
