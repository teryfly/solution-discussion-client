import React, { useEffect, useRef } from 'react';
import { LogsSectionProps } from './KnowledgePanelTypes';

const LogsSection: React.FC<LogsSectionProps> = ({
  executionLogs,
  autoUpdateCode,
  onAutoUpdateCodeChange,
  onClearLogs,
}) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [executionLogs]);

  const getLogTypeStyle = (type: string) => {
    switch (type) {
      case 'error':
        return { color: '#f44336', fontWeight: 'bold' as const };
      case 'warning':
        return { color: '#ff9800', fontWeight: 'bold' as const };
      case 'summary':
        return { color: '#9c27b0', fontWeight: 'bold' as const };
      default:
        return { color: '#666' };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  const formatExecutionSummary = (summary: any) => {
    if (!summary) return '';
    const successful = Number(summary.successful_tasks ?? 0);
    const failed = Number(summary.failed_tasks ?? 0);
    const invalid = Number(summary.invalid_tasks ?? 0);
    return `成功${successful}, 失败${failed}, 无效${invalid}`;
  };

  const getLogDisplayContent = (log: any) => {
    if (log.type === 'summary' && typeof log.data === 'object' && log.data) {
      return formatExecutionSummary(log.data);
    }
    if (log.type === 'error' || log.type === 'warning') {
      return log.message;
    }
    return typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : log.data || log.message;
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          flexShrink: 0,
        }}
      >
        <h4
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#333',
          }}
        >
          日志
        </h4>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '11px',
            color: '#666',
            gap: '4px',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={autoUpdateCode}
              onChange={(e) => onAutoUpdateCodeChange(e.target.checked)}
              style={{ margin: 0, cursor: 'pointer' }}
            />
            <span>自动更新代码</span>
          </label>
        </div>

        {executionLogs.length > 0 && (
          <button
            onClick={onClearLogs}
            style={{
              background: 'none',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '2px 4px',
              fontSize: '12px',
              cursor: 'pointer',
              color: '#666',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="清空日志"
          >
            ×
          </button>
        )}
      </div>

      <div
        ref={logContainerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: '10px',
          lineHeight: 1.4,
          background: '#fafafa',
          border: '1px solid #eee',
          borderRadius: '4px',
          padding: '6px',
          minHeight: 0,
        }}
      >
        {executionLogs.length === 0 ? (
          <div style={{ color: '#999', textAlign: 'center', marginTop: '20px', fontSize: '11px' }}>
            暂无执行日志
          </div>
        ) : (
          executionLogs.map((log) => (
            <div
              key={log.id}
              style={{
                marginBottom: '8px',
                padding: '6px',
                background: '#fff',
                borderRadius: '4px',
                border: '1px solid #eee',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontSize: '9px', color: '#999' }}>{formatTimestamp(log.timestamp)}</span>
                <span
                  style={{
                    ...getLogTypeStyle(log.type),
                    fontSize: '9px',
                    textTransform: 'uppercase',
                  }}
                >
                  {log.type}
                </span>
              </div>
              <div style={{ fontSize: '10px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                {getLogDisplayContent(log)}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default LogsSection;