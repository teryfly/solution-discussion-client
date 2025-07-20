// ConversationLayout.tsx
import React, { useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ConversationList from './ConversationList';
import ChatBox from './ChatBox';
import ChatInput from './ChatInput';
import useConversations from './hooks/useConversations';
import useChatStream from './useChatStream';
import { ROLE_CONFIGS } from './config';

function ConversationLayout() {
  const params = useParams();
  const location = useLocation();
  const chatBoxRef = useRef<HTMLDivElement>(null);

  const {
    conversationId,
    setConversationId,
    messages,
    setMessages,
    model,
    setModel,
    modelOptions,
    conversationList,
    refreshConversations,
    loadConversation,
    handleNewConversation,
    handleSelectConversation,
    handleRenameConversation,
    handleDeleteConversation,
    handleModelChange,
    input,
    setInput,
    toggleCollapse,
    copyMessage,
    saveMessage,
    scrollToBottom,
    scrollToTop,
  } = useConversations({ chatBoxRef, params });

  // 获取当前会话元信息
  const currentMeta = conversationList.find((c) => c.id === conversationId);

  // 获取角色名，优先 location.state.role，其次 currentMeta.name
  let roleName: string = '通用助手';
  if (currentMeta?.name && ROLE_CONFIGS[currentMeta.name]) {
    roleName = currentMeta.name;
  } else if (location.state && (location.state as any).role && ROLE_CONFIGS[(location.state as any).role]) {
    roleName = (location.state as any).role;
  } else {
    roleName = Object.keys(ROLE_CONFIGS)[0];
  }
  const roleDesc = ROLE_CONFIGS[roleName]?.desc || '';

  // 关键：appendMessage 支持 replaceLast
  const appendMessage = (msg, replaceLast = false) => {
    setMessages(prev => {
      if (replaceLast && prev.length > 0) {
        return [...prev.slice(0, -1), msg];
      }
      return [...prev, msg];
    });
  };

  // 用流式 hook 发送消息
  const { send, loading } = useChatStream(
    conversationId,
    model,
    appendMessage
  );

  // 发送消息
  const handleSend = () => {
    if (input.trim() && !loading) {
      send(input);
      setInput('');
    }
  };

  return (
    <div style={{ display: 'flex', flex: 1, height: '100vh', minHeight: 0 }}>
      {/* 会话列表侧栏 */}
      <ConversationList
        conversations={conversationList}
        activeId={conversationId}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
        onRename={handleRenameConversation}
        onDelete={handleDeleteConversation}
        onModelChange={handleModelChange}
        modelOptions={modelOptions}
      />

      {/* 聊天主区 */}
      <div className="chat-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* 角色说明，替换模型选择器 */}
        <div className="chat-toolbar">
          <span style={{ fontWeight: 'bold', color: '#1a73e8' }}>{roleName}</span>
          <span style={{ marginLeft: 12 }}>{roleDesc}</span>
        </div>

        {/* 聊天内容区 */}
        <div className="chat-box-wrapper" style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          <div className="scroll-arrow top" onClick={scrollToTop} style={{ position: 'absolute', top: 0, right: 8, zIndex: 2, cursor: 'pointer' }}>⬆</div>
          <div className="chat-box" ref={chatBoxRef} style={{ overflowY: 'auto', height: '100%', minHeight: 0 }}>
            <ChatBox
              messages={messages}
              onToggle={toggleCollapse}
              onCopy={copyMessage}
              onSave={saveMessage}
              conversationMeta={{
                projectId: currentMeta?.projectId,
                name: currentMeta?.name,
              }}
            />
          </div>
          <div className="scroll-arrow bottom" onClick={scrollToBottom} style={{ position: 'absolute', bottom: 0, right: 8, zIndex: 2, cursor: 'pointer' }}>⬇</div>
        </div>

        {/* 输入区 */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          loading={loading}
        />
      </div>
    </div>
  );
}

export default ConversationLayout;