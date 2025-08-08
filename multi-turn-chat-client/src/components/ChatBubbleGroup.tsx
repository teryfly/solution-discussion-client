import React from 'react';
import { Message } from '../types';
import { COLLAPSE_LENGTH } from '../config';
import useCopyAnimMap from '../hooks/useCopyAnimMap';
import ChatBubbleSingle from './ChatBubbleSingle';
import ChatBubbleMulti from './ChatBubbleMulti';

type MessageWithId = Message & { id?: number };

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
  onCopy?: (text: string) => void;
  onDelete?: (indices: number[]) => void;
  onRelay?: (role: string, content: string) => void;
  onSendTo?: (categoryId: number, content: string) => void;
}

const ChatBubbleGroup: React.FC<ChatBubbleGroupProps> = ({
  groups,
  bubbleRefs,
  onRightClick,
  onToggle,
  onCopy,
  onDelete,
  onRelay,
  onSendTo,
}) => {
  const { copyAnimMap = {}, triggerCopyAnim } = useCopyAnimMap();

  const handleSingleDelete = (idx: number) => {
    onDelete?.([idx]);
  };

  const handleGroupDelete = (indices: number[]) => {
    onDelete?.(indices);
  };

  return (
    <>
      {groups.map((group, groupIdx) => (
        group.msgs.length === 1 ? (
          <ChatBubbleSingle
            key={groupIdx}
            groupIdx={groupIdx}
            msg={group.msgs[0]}
            idxInGroup={0}
            group={group}
            bubbleRefs={bubbleRefs}
            onRightClick={onRightClick}
            onToggle={onToggle}
            onCopy={onCopy}
            onDelete={handleSingleDelete}
            onRelay={onRelay}
            onSendTo={onSendTo}
            copyAnim={Boolean(copyAnimMap && copyAnimMap[`${groupIdx}-0`])}
            triggerCopyAnim={triggerCopyAnim}
            COLLAPSE_LENGTH={COLLAPSE_LENGTH}
          />
        ) : (
          <ChatBubbleMulti
            key={groupIdx}
            groupIdx={groupIdx}
            group={group}
            bubbleRefs={bubbleRefs}
            onRightClick={onRightClick}
            onToggle={onToggle}
            onCopy={onCopy}
            onDelete={handleGroupDelete}
            onRelay={onRelay}
            onSendTo={onSendTo}
            copyAnimMap={copyAnimMap || {}}
            triggerCopyAnim={triggerCopyAnim}
            COLLAPSE_LENGTH={COLLAPSE_LENGTH}
          />
        )
      ))}
    </>
  );
};

export default ChatBubbleGroup;