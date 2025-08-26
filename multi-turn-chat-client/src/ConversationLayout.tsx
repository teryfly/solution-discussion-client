import React, { useState, useCallback } from 'react';
import ConversationList from './ConversationList';
import ConversationHeader from './components/ConversationHeader';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';
import KnowledgePanel from './components/KnowledgePanel';
import { useConversationLayout } from './hooks/useConversationLayout';
import { ProjectProvider } from './context/ProjectContext';
import { writeSourceCode } from './api';

interface LogEntry {
  id: string;
  message: string;
  type: string;
  timestamp: string;
  data?: any;
}

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
    refreshProjects,
  } = useConversationLayout();

  const [executionLogs, setExecutionLogs] = useState<LogEntry[]>([]);
  const [autoUpdateCode, setAutoUpdateCode] = useState(true);

  const currentProjectId = currentMeta?.projectId ?? selectedProjectId;

  // 清空执行日志
  const handleClearExecutionLogs = useCallback(() => {
    setExecutionLogs([]);
  }, []);

  // 自动更新代码复选框变化处理
  const handleAutoUpdateCodeChange = useCallback((checked: boolean) => {
    setAutoUpdateCode(checked);
  }, []);

  // 消息完成时的处理
  const handleMessageComplete = useCallback(async (content: string) => {
    if (!autoUpdateCode || !currentMeta?.projectId) {
      return;
    }

    try {
      // 获取项目详情，获取AI工作目录
      const { getProjectDetail } = await import('./api');
      const project = await getProjectDetail(currentMeta.projectId);
      const aiWorkDir = project.ai_work_dir || project.aiWorkDir;
      
      if (!aiWorkDir) {
        console.warn('项目未配置AI工作目录，无法自动更新代码');
        return;
      }

      // 调用写入源码API
      await writeSourceCode(
        aiWorkDir,
        content,
        (data) => {
          // 只处理 error, warning, summary 类型的日志
          if (['error', 'warning', 'summary'].includes(data.type)) {
            const logEntry: LogEntry = {
              id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              message: data.message,
              type: data.type,
              timestamp: data.timestamp,
              data: data.data,
            };
            setExecutionLogs(prev => [...prev, logEntry]);
          }
        },
        () => {
          // 执行完成
          console.log('自动更新代码完成');
        },
        (error) => {
          // 执行出错
          const errorLog: LogEntry = {
            id: `error_${Date.now()}`,
            message: `自动更新代码失败: ${error?.message || error}`,
            type: 'error',
            timestamp: new Date().toISOString(),
            data: error?.message || error,
          };
          setExecutionLogs(prev => [...prev, errorLog]);
        }
      );
    } catch (e: any) {
      console.error('自动更新代码失败:', e);
      const errorLog: LogEntry = {
        id: `error_${Date.now()}`,
        message: `自动更新代码失败: ${e?.message || e}`,
        type: 'error',
        timestamp: new Date().toISOString(),
        data: e?.message || e,
      };
      setExecutionLogs(prev => [...prev, errorLog]);
    }
  }, [autoUpdateCode, currentMeta?.projectId]);

  return (
    <ProjectProvider projects={projects as any} currentProjectId={currentProjectId}>
      <div style={{ display: 'flex', flex: 1, height: '100vh', minHeight: 0 }}>
        {/* 项目列表 */}
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
          onProjectUpdate={refreshProjects}
        />

        {/* 聊天区域 */}
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
            executionLogs={executionLogs}
            onClearExecutionLogs={handleClearExecutionLogs}
            onMessageComplete={handleMessageComplete}
          />
          <InputArea
            inputVisible={inputVisible}
            showStop={showStop}
            input={input}
            loading={loading}
            autoUpdateCode={autoUpdateCode}
            onInputChange={setInput}
            onSend={handleSendMessage}
            onStop={handleStopClick}
            onAutoUpdateCodeChange={handleAutoUpdateCodeChange}
          />
        </div>

        {/* 知识库面板 - 移到最右边，包含执行日志 */}
        <KnowledgePanel
          conversationId={conversationId}
          currentMeta={currentMeta}
          executionLogs={executionLogs}
          onClearLogs={handleClearExecutionLogs}
        />
      </div>
    </ProjectProvider>
  );
}

export default ConversationLayout;