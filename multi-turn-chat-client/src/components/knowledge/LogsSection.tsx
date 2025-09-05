import React from 'react';
import { LogsSectionProps } from './KnowledgePanelTypes';
import LogsHeader from './LogsHeader';
import LogsList from './LogsList';

const LogsSection: React.FC<LogsSectionProps> = ({
  executionLogs,
  autoUpdateCode,
  onAutoUpdateCodeChange,
  onClearLogs,
}) => {
  return (
    <>
      <LogsHeader
        count={executionLogs.length}
        autoUpdateCode={autoUpdateCode}
        onAutoUpdateCodeChange={onAutoUpdateCodeChange}
        onClearLogs={onClearLogs}
      />
      <LogsList logs={executionLogs as any} />
      <div
        style={{
          marginTop: 8,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <button
          id="rewrite-all-source-trigger"
          style={{
            background: '#d32f2f',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: 12,
            cursor: 'pointer',
          }}
          onClick={() => {
            const event = new CustomEvent('rewrite-all-source');
            window.dispatchEvent(event);
          }}
          title="根据包含 Step [ 的历史助手输出拼接内容并写入项目源码"
        >
          重写全部源码
        </button>
      </div>
    </>
  );
};

export default LogsSection;