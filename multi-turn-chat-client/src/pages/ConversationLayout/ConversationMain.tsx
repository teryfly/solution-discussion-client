// src/pages/ConversationLayout/ConversationMain.tsx
import React, { useEffect, useRef, useState } from 'react';
import ConversationList from '../../ConversationList';
import ChatBox from '../../components/ChatBox';
import ChatInput from '../../ChatInput';
import ConversationHeader from './ConversationHeader';
import useConversationState from './useConversationState';
import './styles.css';

const ConversationMain: React.FC = () => {
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  const {
    conversationId,
    currentMeta,
    conversationList,
    messages,
    input,
    loading,
    model,
    modelOptions,
    send,
    setInput,
    toggleCollapse,
    copyMessage,
    saveMessage,
    handleNewConversation,
    handleSelectConversation,
    handleRenameConversation,
    handleDeleteConversation,
    handleModelChange,
    scrollToTop,
    scrollToBottom,
    appendMessage,
  } = useConversationState(chatBoxRef);

  const handleSend = () => {
    if (input.trim() && !loading) {
      send(input);
      setInput('');
    }
  };

  useEffect(() => {
    if (isAutoScroll && chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isAutoScroll]);

  useEffect(() => {
    const box = chatBoxRef.current;
    if (!box) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = box;
      setIsAutoScroll(scrollHeight - (scrollTop + clientHeight) < 2);
    };
    box.addEventListener('scroll', onScroll);
    return () => box.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (typeof detail === 'string') send(detail);
    };
    window.addEventListener('auto-send-msg', handler);
    return () => window.removeEventListener('auto-send-msg', handler);
  }, [send]);

  return (
    <div className="conversation-layout">
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

      <div className="chat-container">
        <ConversationHeader meta={currentMeta} />
        <div className="chat-box-wrapper">
          <div className="scroll-arrow top" onClick={scrollToTop}>⬆</div>
          <div className="chat-box" ref={chatBoxRef}>
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
        <ChatInput value={input} onChange={setInput} onSend={handleSend} loading={loading} />
      </div>
    </div>
  );
};

export default ConversationMain;
