// ConversationLayout.tsx
import React, { useRef, useEffect, useState } from 'react';
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

  // ⭐️ 新增自动滚动控制相关
  const [isAutoScroll, setIsAutoScroll] = useState(true);

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
    appendMessage,
  } = useConversations({ chatBoxRef, params });

  // 自动选中第一个分组下第一个会话
  useEffect(() => {
    if (!conversationId && conversationList.length > 0) {
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
  }, [conversationId, conversationList]);

  const currentMeta = conversationList.find((c) => c.id === conversationId);

  let roleName: string = '通用助手';
  if (currentMeta?.assistanceRole && ROLE_CONFIGS[currentMeta.assistanceRole]) {
    roleName = currentMeta.assistanceRole;
  } else if (location.state && (location.state as any).role && ROLE_CONFIGS[(location.state as any).role]) {
    roleName = (location.state as any).role;
  }
  const roleDesc = ROLE_CONFIGS[roleName]?.desc || '';

  const { send, loading } = useChatStream(
    conversationId,
    model,
    appendMessage
  );

  const handleSend = () => {
    if (input.trim() && !loading) {
      send(input);
      setInput('');
    }
  };

  // ⭐️ 自动滚动到最新（仅当 isAutoScroll 为 true）
  useEffect(() => {
    if (!chatBoxRef.current) return;
    if (isAutoScroll) {
      // 立即滚到底部
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isAutoScroll]);

  // ⭐️ 监听用户滚动，判断是否在底部
  useEffect(() => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return;

    const handleScroll = () => {
      // 判断是否在底部（允许2px误差）
      const { scrollTop, scrollHeight, clientHeight } = chatBox;
      if (scrollHeight - (scrollTop + clientHeight) < 2) {
        // 在底部
        setIsAutoScroll(true);
      } else {
        setIsAutoScroll(false);
      }
    };

    chatBox.addEventListener('scroll', handleScroll);
    return () => {
      chatBox.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // ⭐️ 手动点击⬇按钮时也恢复自动滚动
  const handleScrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setIsAutoScroll(true);
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
          <div
            className="chat-box"
            ref={chatBoxRef}
            style={{ overflowY: 'auto', height: '100%', minHeight: 0 }}
          >
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
          <div className="scroll-arrow bottom" onClick={handleScrollToBottom}>⬇</div>
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