import React from 'react';
import ConversationList from './ConversationList';
import ConversationHeader from './components/ConversationHeader';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import { useConversationLayout } from './hooks/useConversationLayout';
import { ProjectProvider } from './context/ProjectContext';
function ConversationLayout() {
  const {
    // 状态
    projects,
    selectedProjectId,
    conversationId,
    currentMeta,
    conversationList,
    messages,
    modelOptions,
    input,
    loading,
    inputVisible,
    showStop,
    location,
    // 方法
    handleProjectSelect,
    setInput,
    handleNewConversation,
    handleConversationSelect,
    handleRenameConversation,
    handleDeleteConversation,
    handleModelChange,
    toggleCollapse,
    copyMessage,
    saveMessage,
    scrollToBottom,
    scrollToTop,
    handleRelayRole,
    handleStopClick,
    handleSendMessage,
    setMessages,
    refreshProjects, // 新增：项目刷新方法
  } = useConversationLayout();
  const currentProjectId = currentMeta?.projectId ?? selectedProjectId;
  return (
    <ProjectProvider projects={projects as any} currentProjectId={currentProjectId}>
      <div style={{ display: 'flex', flex: 1, height: '100vh', minHeight: 0 }}>
        <ConversationList
          projects={projects}
          selectedProjectId={selectedProjectId}
          onProjectSelect={handleProjectSelect}
          conversations={conversationList}
          activeId={conversationId}
          onSelect={handleConversationSelect}
          onNew={handleNewConversation}
          onRename={handleRenameConversation}
          onDelete={handleDeleteConversation}
          onModelChange={handleModelChange}
          modelOptions={modelOptions}
          onProjectUpdate={refreshProjects} // 传递项目更新回调
        />
        <div className="chat-container" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          ...(inputVisible ? {} : { height: '100vh', minHeight: 0, paddingBottom: 0 }),
        }}>
          <ConversationHeader
            currentMeta={currentMeta}
            conversationId={conversationId}
            location={location}
          />
          <ChatArea
            messages={messages}
            currentMeta={currentMeta}
            inputVisible={inputVisible}
            onToggle={toggleCollapse}
            onCopy={copyMessage}
            onSave={saveMessage}
            onRelayRole={handleRelayRole}
            onInputValueChange={setInput}
            setMessages={setMessages}
            onScrollToTop={scrollToTop}
            onScrollToBottom={scrollToBottom}
            conversationId={conversationId}
          />
          <InputArea
            inputVisible={inputVisible}
            showStop={showStop}
            input={input}
            loading={loading}
            onInputChange={setInput}
            onSend={handleSendMessage}
            onStop={handleStopClick}
          />
        </div>
      </div>
    </ProjectProvider>
  );
}
export default ConversationLayout;