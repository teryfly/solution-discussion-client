import React, { useState, useCallback, useEffect } from 'react';
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
    // 新增：文档引用相关
    loadDocumentReferences,
  } = useConversationLayout();

  const [executionLogs, setExecutionLogs] = useState<LogEntry[]>([]);
  const [autoUpdateCode, setAutoUpdateCode] = useState(false);
  const [lastExecutionSummary, setLastExecutionSummary] = useState<any>(null);
  const [autoUpdateStateAtStart, setAutoUpdateStateAtStart] = useState<boolean | null>(null);

  const currentProjectId = currentMeta?.projectId ?? selectedProjectId;

  // 添加日志的辅助函数
  const addLog = useCallback((message: string, type: string = 'info', data?: any) => {
    const logEntry: LogEntry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      message,
      type,
      timestamp: new Date().toISOString(),
      data,
    };
    setExecutionLogs(prev => [...prev, logEntry]);
    return logEntry.id;
  }, []);

  // 清空执行日志
  const handleClearExecutionLogs = useCallback(() => {
    setExecutionLogs([]);
    setLastExecutionSummary(null);
    setAutoUpdateStateAtStart(null);
  }, []);

  // 自动更新代码复选框变化处理
  const handleAutoUpdateCodeChange = useCallback((checked: boolean) => {
    setAutoUpdateCode(checked);
  }, []);

  // 处理文档引用变化 - 重新加载文档引用
  const handleDocumentReferencesChange = useCallback(() => {
    if (loadDocumentReferences) {
      loadDocumentReferences();
    }
  }, [loadDocumentReferences]);

  // 监听用户发送消息
  const handleUserSendMessage = useCallback(() => {
    if (input.trim() && !loading) {
      // 记录发送时的自动更新代码状态
      setAutoUpdateStateAtStart(autoUpdateCode);
      
      handleSendMessage();
    }
  }, [input, loading, autoUpdateCode, handleSendMessage, addLog]);

  // 处理消息完成
  const handleMessageComplete = useCallback(async (content: string, finalCharCount: number) => {
    // 修正状态判断逻辑：只有从勾选变为不勾选才算取消
    console.log('状态检查:', {
      autoUpdateStateAtStart,
      currentAutoUpdateCode: autoUpdateCode,
      shouldCancel: autoUpdateStateAtStart === true && autoUpdateCode === false
    });

    // 只有当开始时勾选了但现在不勾选时，才算是用户取消了代码更新
    if (autoUpdateStateAtStart === true && autoUpdateCode === false) {
      addLog('代码更新已取消', 'warning');
      return;
    }

    // 如果当前没有勾选自动更新代码，或者没有项目ID，则不执行（不显示取消消息）
    if (!autoUpdateCode || !currentMeta?.projectId) {
      return;
    }

    try {
      // 获取项目详情，获取AI工作目录
      const { getProjectDetail } = await import('./api');
      const project = await getProjectDetail(currentMeta.projectId);
      const aiWorkDir = project.ai_work_dir || project.aiWorkDir;
      
      if (!aiWorkDir) {
        addLog('项目未配置AI工作目录，无法自动更新代码', 'warning');
        return;
      }

      // 调用写入源码API
      await writeSourceCode(
        aiWorkDir,
        content,
        (data) => {
          // 只处理 error, warning, summary 类型的日志
          if (['error', 'warning', 'summary'].includes(data.type)) {
            addLog(data.message, data.type, data.data);
            
            // 如果是summary类型，保存摘要信息
            if (data.type === 'summary') {
              setLastExecutionSummary(data.data);
            }
          }
        },
        () => {
          // 执行完成
          console.log('自动更新代码完成');
        },
        (error) => {
          // 执行出错
          addLog(`自动更新代码失败: ${error?.message || error}`, 'error', error?.message || error);
        }
      );
    } catch (e: any) {
      console.error('自动更新代码失败:', e);
      addLog(`自动更新代码失败: ${e?.message || e}`, 'error', e?.message || e);
    }
  }, [autoUpdateCode, autoUpdateStateAtStart, currentMeta?.projectId, addLog]);

  // 监听来自useChatStream的事件
  useEffect(() => {
    const handleMessageCompleteEvent = (event: CustomEvent) => {
      const { content, charCount } = event.detail;
      handleMessageComplete(content, charCount);
    };

    window.addEventListener('message-complete', handleMessageCompleteEvent as EventListener);

    return () => {
      window.removeEventListener('message-complete', handleMessageCompleteEvent as EventListener);
    };
  }, [handleMessageComplete]);

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
          />
          <InputArea
            inputVisible={inputVisible}
            showStop={showStop}
            input={input}
            loading={loading}
            autoUpdateCode={autoUpdateCode}
            onInputChange={setInput}
            onSend={handleUserSendMessage} 
            onStop={handleStopClick}
            onAutoUpdateCodeChange={handleAutoUpdateCodeChange}
          />
        </div>

        {/* 知识库面板 */}
        <KnowledgePanel
          conversationId={conversationId}
          currentMeta={currentMeta}
          executionLogs={executionLogs}
          onClearLogs={handleClearExecutionLogs}
          lastExecutionSummary={lastExecutionSummary}
          autoUpdateCode={autoUpdateCode}
          onAutoUpdateCodeChange={handleAutoUpdateCodeChange}
          onDocumentReferencesChange={handleDocumentReferencesChange}
        />
      </div>
    </ProjectProvider>
  );
}

// 添加默认导出
export default ConversationLayout;