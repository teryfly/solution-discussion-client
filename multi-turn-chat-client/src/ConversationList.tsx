// src/ConversationList.tsx
import React from 'react';

export interface ConversationMeta {
  id: string;
  model: string;
  createdAt: string;
}

interface Props {
  conversations: ConversationMeta[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}

const ConversationList: React.FC<Props> = ({ conversations, activeId, onSelect, onNew }) => {
  return (
    <div className="conversation-list">
      <h3>会话列表</h3>
      <ul>
        {conversations.map((conv) => (
          <li
            key={conv.id}
            className={conv.id === activeId ? 'active' : ''}
            onClick={() => onSelect(conv.id)}
          >
            <strong>{conv.model}</strong><br />
            <small>{new Date(conv.createdAt).toLocaleString()}</small>
          </li>
        ))}
      </ul>
      <button onClick={onNew}>➕ 新建会话</button>
    </div>
  );
};

export default ConversationList;
