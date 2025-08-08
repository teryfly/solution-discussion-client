// ConversationLayout.tsx
import React, { useRef, useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ConversationList from './ConversationList';
import ChatBox from './ChatBox';
import ChatInput from './ChatInput';
import useConversations from './hooks/useConversations';
import useChatStream, { threadManager } from './hooks/useChatStream';
import { ROLE_CONFIGS } from './config';
import { createConversation } from './api';

function ConversationLayout() {
  const params = useParams();
  const location = useLocation();
  const chatBoxRef = useRef<HTMLDivElement>(null);

  const [isAutoScroll, setIsAutoScroll] = useState(true);

  const {
    conversationId,
    setConversationId,
    setConversationList,
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

  const { send, loading, setActiveConversation } = useChatStream(
    conversationId,
    model,
    appendMessage
  );

  // 当切换会话时，设置线程为活跃状态
  useEffect(() => {
    if (conversationId) {
      setActiveConversation();
    }
  }, [conversationId, setActiveConversation]);

  const handleSend = () => {
    if (input.trim() && !loading) {
      send(input);
      setInput('');
    }
  };

  // 修改后的自动滚动逻辑：
  useEffect(() => {
    if (!chatBoxRef.current) return;
    // 只在自动滚动开关开启，且最新消息为 assistant 回复且未处于折叠状态时，执行滚动
    const lastMsg = messages[messages.length - 1];
    const shouldScroll =
      isAutoScroll &&
      lastMsg &&
      lastMsg.role === 'assistant' &&
      typeof lastMsg.content === 'string' &&
      !lastMsg.collapsed;

    if (shouldScroll) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isAutoScroll]);

  useEffect(() => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatBox;
      if (scrollHeight - (scrollTop + clientHeight) < 2) {
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

  const handleScrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setIsAutoScroll(true);
    }
  };

  // ===============================
  // "转交角色..."功能
  // ===============================
  const [relayLock, setRelayLock] = useState(false);
  const [relayLoading, setRelayLoading] = useState(false);

  const handleRelayRole = async (relayRole: string, relayContent: string) => {
    if (relayLock) return;
    setRelayLock(true);

    try {
      const baseName = (currentMeta?.name || '未命名会话') + '转交';
      const projectId = currentMeta?.projectId || 0;
      const projectName = currentMeta?.projectName || '其它';
      const roleModel = ROLE_CONFIGS[relayRole]?.model || modelOptions[0] || '';
      const systemPrompt = ROLE_CONFIGS[relayRole]?.prompt || '';

      // 创建新会话（后端）
      const convId = await createConversation(
        systemPrompt,
        projectId,
        baseName,
        roleModel,
        relayRole
      );

      const newMeta = {
        id: convId,
        model: roleModel,
        name: baseName,
        createdAt: new Date().toISOString(),
        projectId,
        projectName,
        assistanceRole: relayRole,
      };

      setConversationList((prev) => [...prev, newMeta]);
      setConversationId(convId);
      setMessages([]); // 清空消息区

      setTimeout(() => {
        // 使用新的线程管理器创建独立线程
        const thread = threadManager.createThread(convId, appendMessage, setRelayLoading);
        threadManager.setActiveThread(convId);
        thread.send(relayContent, roleModel);
      }, 80);

    } catch (e) {
      alert('转交会话失败: ' + ((e as any)?.message || e));
    } finally {
      setTimeout(() => setRelayLock(false), 500);
    }
  };

  // 会话切换时的处理
  const handleConversationSelect = (id: string) => {
    handleSelectConversation(id);
    // 设置新的活跃线程
    setTimeout(() => {
      if (threadManager) {
        threadManager.setActiveThread(id);
      }
    }, 100);
  };

  // 关键：将 setInput 和 setMessages 传递给ChatBox
  return (
    <div style={{ display: 'flex', flex: 1, height: '100vh', minHeight: 0 }}>
      <ConversationList
        conversations={conversationList}
        activeId={conversationId}
        onSelect={handleConversationSelect}
        onNew={handleNewConversation}
        onRename={handleRenameConversation}
        onDelete={handleDeleteConversation}
        onModelChange={handleModelChange}
        modelOptions={modelOptions}
      />
      <div className="chat-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="chat-toolbar">
          <span style={{ fontWeight: 'bold', color: '#1a73e8' }}>{roleName}</span>
          <span style={{ marginLeft: 12 }}>{roleDesc}</span>
          {/* 显示当前会话的线程状态 */}
          {conversationId && threadManager.isThreadActive(conversationId) && (
            <span style={{ marginLeft: 12, color: '#4caf50', fontSize: '12px' }}>● 活跃线程</span>
          )}
        </div>
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
              onRelayRole={handleRelayRole}
              onInputValueChange={setInput}
              setMessages={setMessages}
            />
          </div>
          <div className="scroll-arrow bottom" onClick={handleScrollToBottom}>⬇</div>
        </div>
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