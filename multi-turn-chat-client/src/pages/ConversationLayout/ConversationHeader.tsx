// src/pages/ConversationLayout/ConversationHeader.tsx
import React from 'react';
import { ROLE_CONFIGS } from '../../config';
import { ConversationMeta } from '../../types';

interface Props {
  meta?: ConversationMeta;
}

const ConversationHeader: React.FC<Props> = ({ meta }) => {
  const role = meta?.assistanceRole && ROLE_CONFIGS[meta.assistanceRole]
    ? meta.assistanceRole
    : '通用助手';

  const desc = ROLE_CONFIGS[role]?.desc || '';

  return (
    <div className="chat-toolbar">
      <span style={{ fontWeight: 'bold', color: '#1a73e8' }}>{role}</span>
      <span style={{ marginLeft: 12 }}>{desc}</span>
    </div>
  );
};

export default ConversationHeader;
