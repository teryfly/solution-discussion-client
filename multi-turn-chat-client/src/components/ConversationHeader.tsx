import React from 'react';
import { ROLE_CONFIGS } from '../config';
import { ConversationMeta } from '../types';
import { threadManager } from '../hooks/useChatStream';
interface ConversationHeaderProps {
  currentMeta?: ConversationMeta;
  conversationId: string;
  location: any;
}
const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  currentMeta,
  conversationId,
  location,
}) => {
  let roleName: string = '通用助手';
  if (currentMeta?.assistanceRole && ROLE_CONFIGS[currentMeta.assistanceRole]) {
    roleName = currentMeta.assistanceRole;
  } else if (location.state && (location.state as any).role && ROLE_CONFIGS[(location.state as any).role]) {
    roleName = (location.state as any).role;
  }
  const roleDesc = ROLE_CONFIGS[roleName]?.desc || '';
  return (
    <div className="chat-toolbar">
      <span style={{ fontWeight: 'bold', color: '#1a73e8' }}>{roleName}</span>
      <span style={{ marginLeft: 12 }}>{roleDesc}</span>
      {conversationId && threadManager.isThreadActive(conversationId) && (
        <span style={{ marginLeft: 12, color: '#4caf50', fontSize: '12px' }}>● 活跃线程</span>
      )}
    </div>
  );
};
export default ConversationHeader;