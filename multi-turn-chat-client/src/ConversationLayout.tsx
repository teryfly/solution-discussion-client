// ConversationLayout.tsx
import React, { useRef, useEffect } from 'react';
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
    appendMessage, // 确保 appendMessage 已暴露
  } = useConversations({ chatBoxRef, params });

  // 自动选中第一个分组下第一个会话
  useEffect(() => {
    if (!conversationId && conversationList.length > 0) {
      // 分组
      const grouped = conversationList.reduce((acc, conv) => {
        const key = conv.projectName || '其它';
        if (!acc[key]) acc[key] = [];
        acc[key].push(conv);
        return acc;
      }, {} as Record<string, typeof conversationList>);

      const firstProject = Object.keys(grouped)[0];
      const firstConv = grouped[firstProject]?.[0];
      if (firstConv) {
        handleSelectConversation(firstConv.id);
      }
    }
  }, [conversationId, conversationList]); // 只要有会话且未选中时自动选

  // 获取当前会话元信息
  const currentMeta = conversationList.find((c) => c.id === conversationId);

  // 获取角色名：优先 currentMeta.assistanceRole，其次 location.state.role
  let roleName: string = '通用助手';
  if (currentMeta?.assistanceRole && ROLE_CONFIGS[currentMeta.assistanceRole]) {
    roleName = currentMeta.assistanceRole;
  } else if (location.state && (location.state as any).role && ROLE_CONFIGS[(location.state as any).role]) {
    roleName = (location.state as any).role;
  }
  const roleDesc = ROLE_CONFIGS[roleName]?.desc || '';

  // 使用流式发送消息 hook
  const { send, loading } = useChatStream(
    conversationId,
    model,
    appendMessage // 关键！传递 appendMessage
  );

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
        {/* 会话顶部助手角色描述 */}
        <div className="chat-toolbar">
          <span style={{ fontWeight: 'bold', color: '#1a73e8' }}>{roleName}</span>
          <span style={{ marginLeft: 12 }}>{roleDesc}</span>
        </div>

        {/* 聊天内容区 */}
        <div className="chat-box-wrapper" style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          <div className="scroll-arrow top" onClick={scrollToTop}>⬆</div>
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
          <div className="scroll-arrow bottom" onClick={scrollToBottom}>⬇</div>
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