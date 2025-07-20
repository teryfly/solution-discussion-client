// ConversationLayout.tsx
import React, { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ConversationList from './ConversationList';
import ChatBox from './ChatBox';
import ChatInput from './ChatInput';
import ModelSelector from './ModelSelector';
import useConversations from './hooks/useConversations';
import useChatStream from './useChatStream';

function ConversationLayout() {
  const navigate = useNavigate();
  const params = useParams();
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // 用自定义 Hook 管理会话、消息、模型等状态
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
    input,          // 用 hook 里的 input
    setInput,       // 用 hook 里的 setInput
    toggleCollapse,
    copyMessage,
    saveMessage,
    scrollToBottom,
    scrollToTop,
  } = useConversations({ chatBoxRef, params, navigate });

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

  // 获取当前会话元信息，用于“发送到”功能
  const currentMeta = conversationList.find((c) => c.id === conversationId);

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
        {/* 模型选择器 */}
        <ModelSelector value={model} options={modelOptions} onChange={setModel} />

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