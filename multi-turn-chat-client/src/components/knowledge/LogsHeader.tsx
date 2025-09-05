import React from 'react';

interface Props {
  count: number;
  autoUpdateCode: boolean;
  onAutoUpdateCodeChange: (checked: boolean) => void;
  onClearLogs?: () => void;
}

const LogsHeader: React.FC<Props> = ({ count, autoUpdateCode, onAutoUpdateCodeChange, onClearLogs }) => {
  return (
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

      {count > 0 && (
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
  );
};

export default LogsHeader;