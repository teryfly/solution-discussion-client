import React, { useState, useRef, useEffect } from 'react';
import { writeSourceCode } from '../api';
interface WriteSourceCodeModalProps {
  visible: boolean;
  onClose: () => void;
  rootDir: string;
  filesContent: string;
}
interface LogEntry {
  id: string;
  message: string;
  type: string;
  timestamp: string;
  data?: any;
}
const WriteSourceCodeModal: React.FC<WriteSourceCodeModalProps> = ({
  visible,
  onClose,
  rootDir,
  filesContent,
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const executionIdRef = useRef<string>('');
  // 自动滚动到底部
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);
  // 开始执行写入源码
  const startExecution = async () => {
    if (!rootDir || !filesContent) {
      alert('缺少必要参数');
      return;
    }
    setLogs([]);
    setIsRunning(true);
    setIsCompleted(false);
    setSummary(null);
    executionIdRef.current = Date.now().toString();
    try {
      await writeSourceCode(
        rootDir,
        filesContent,
        (data) => {
          const logEntry: LogEntry = {
            id: `${executionIdRef.current}_${Date.now()}_${Math.random()}`,
            message: data.message,
            type: data.type,
            timestamp: data.timestamp,
            data: data.data,
          };
          setLogs(prev => [...prev, logEntry]);
          // 如果是summary类型，保存摘要信息
          if (data.type === 'summary') {
            setSummary(data.data);
          }
        },
        () => {
          setIsRunning(false);
          setIsCompleted(true);
        },
        (error) => {
          setIsRunning(false);
          setIsCompleted(true);
          const errorLog: LogEntry = {
            id: `${executionIdRef.current}_error_${Date.now()}`,
            message: `执行失败: ${error?.message || error}`,
            type: 'error',
            timestamp: new Date().toISOString(),
          };
          setLogs(prev => [...prev, errorLog]);
        }
      );
    } catch (error) {
      setIsRunning(false);
      setIsCompleted(true);
      const errorLog: LogEntry = {
        id: `${executionIdRef.current}_error_${Date.now()}`,
        message: `启动失败: ${(error as any)?.message || error}`,
        type: 'error',
        timestamp: new Date().toISOString(),
      };
      setLogs(prev => [...prev, errorLog]);
    }
  };
  // 重置状态
  const resetState = () => {
    setLogs([]);
    setIsRunning(false);
    setIsCompleted(false);
    setSummary(null);
  };
  // 关闭弹窗
  const handleClose = () => {
    if (isRunning) {
      if (!window.confirm('正在执行中，确定要关闭吗？')) {
        return;
      }
    }
    resetState();
    onClose();
  };
  // 获取日志类型对应的样式
  const getLogTypeStyle = (type: string) => {
    switch (type) {
      case 'success':
        return { color: '#4caf50', fontWeight: 'bold' };
      case 'error':
        return { color: '#f44336', fontWeight: 'bold' };
      case 'warning':
        return { color: '#ff9800', fontWeight: 'bold' };
      case 'progress':
        return { color: '#2196f3', fontWeight: 'bold' };
      case 'summary':
        return { color: '#9c27b0', fontWeight: 'bold' };
      default:
        return { color: '#666' };
    }
  };
  // 格式化时间戳
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  // 复制日志功能
  const handleCopyLogs = async () => {
    if (logs.length === 0) {
      alert('暂无日志可复制');
      return;
    }

    try {
      const logText = logs.map(log => {
        const timestamp = formatTimestamp(log.timestamp);
        return `[${timestamp}] ${log.type.toUpperCase()}: ${log.message}`;
      }).join('\n');

      await navigator.clipboard.writeText(logText);
      
      // 简单的视觉反馈 - 暂时改变按钮文本
      const button = document.querySelector('.copy-logs-btn') as HTMLButtonElement;
      if (button) {
        const originalText = button.textContent;
        button.textContent = '已复制';
        button.style.background = '#4caf50';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = '#f5f5f5';
        }, 1000);
      }
    } catch (error) {
      console.error('复制日志失败:', error);
      alert('复制日志失败，请重试');
    }
  };

  // 键盘快捷键支持
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [visible, isRunning]);
  // 组件挂载时自动开始执行
  useEffect(() => {
    if (visible && !isRunning && logs.length === 0) {
      setTimeout(startExecution, 100);
    }
  }, [visible]);
  if (!visible) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          width: '90%',
          maxWidth: 1000,
          height: '80%',
          maxHeight: 800,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* 头部 */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: '#333' }}>写入项目源码</h2>
            <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
              目标目录: {rootDir}
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#999',
              padding: 0,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="关闭"
          >
            ×
          </button>
        </div>
        {/* 状态栏 */}
        <div
          style={{
            padding: '12px 24px',
            background: '#f8f9fa',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: isRunning ? '#4caf50' : isCompleted ? '#2196f3' : '#ccc',
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 500 }}>
              {isRunning ? '执行中...' : isCompleted ? '执行完成' : '准备中'}
            </span>
          </div>
          {summary && (
            <div style={{ fontSize: 14, color: '#666' }}>
              总任务: {summary.total_tasks} | 
              成功: {summary.successful_tasks} | 
              失败: {summary.failed_tasks} | 
              耗时: {summary.execution_time}
            </div>
          )}
        </div>
        {/* 日志区域 */}
        <div
          ref={logContainerRef}
          style={{
            flex: 1,
            padding: 16,
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: 13,
            lineHeight: 1.5,
            background: '#fafafa',
          }}
        >
          {logs.length === 0 && !isRunning && (
            <div style={{ color: '#999', textAlign: 'center', marginTop: 40 }}>
              正在启动执行...
            </div>
          )}
          {logs.map((log) => (
            <div
              key={log.id}
              style={{
                marginBottom: 8,
                padding: '8px 12px',
                background: '#fff',
                borderRadius: 6,
                border: '1px solid #eee',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: '#999',
                  flexShrink: 0,
                  minWidth: 60,
                }}
              >
                {formatTimestamp(log.timestamp)}
              </span>
              <span
                style={{
                  ...getLogTypeStyle(log.type),
                  flexShrink: 0,
                  minWidth: 60,
                  fontSize: 11,
                  textTransform: 'uppercase',
                }}
              >
                {log.type}
              </span>
              <span style={{ flex: 1, wordBreak: 'break-word' }}>
                {log.message}
              </span>
            </div>
          ))}
          {isRunning && (
            <div
              style={{
                color: '#2196f3',
                textAlign: 'center',
                marginTop: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  border: '2px solid #e3f2fd',
                  borderTop: '2px solid #2196f3',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              正在执行中...
            </div>
          )}
        </div>
        {/* 底部操作栏 */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            flexShrink: 0,
          }}
        >
          {!isRunning && logs.length > 0 && (
            <button
              className="copy-logs-btn"
              onClick={handleCopyLogs}
              style={{
                padding: '8px 16px',
                background: '#f5f5f5',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              复制日志
            </button>
          )}
          {!isRunning && isCompleted && (
            <button
              onClick={startExecution}
              style={{
                padding: '8px 16px',
                background: '#1a73e8',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              重新执行
            </button>
          )}
          <button
            onClick={handleClose}
            style={{
              padding: '8px 16px',
              background: isRunning ? '#f44336' : '#666',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            {isRunning ? '强制关闭' : '关闭'}
          </button>
        </div>
      </div>
      {/* 添加旋转动画的CSS */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};
export default WriteSourceCodeModal;