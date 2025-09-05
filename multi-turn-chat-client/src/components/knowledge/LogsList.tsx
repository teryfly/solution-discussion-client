import React, { useEffect, useRef } from 'react';
import {
  buildLogBody,
  ExecLog,
  formatTimestamp,
  getDisplayType,
  getLogTypeStyle,
} from './logUtils';

interface Props {
  logs: ExecLog[];
}

const containerStyle: React.CSSProperties = {
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
};

const LogsList: React.FC<Props> = ({ logs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // No filtering of type: info/success/warning/progress/summary/error all rendered
  const items: ExecLog[] = Array.isArray(logs) ? logs : [];

  return (
    <div ref={logContainerRef} style={containerStyle}>
      {items.length === 0 ? (
        <div style={{ color: '#999', textAlign: 'center', marginTop: '20px', fontSize: '11px' }}>
          暂无执行日志
        </div>
      ) : (
        items.map((log) => {
          const displayType = getDisplayType(log.type, log.data);
          const body = buildLogBody(log);
          return (
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
                    ...getLogTypeStyle(displayType),
                    fontSize: '9px',
                    textTransform: 'uppercase',
                  }}
                >
                  {displayType}
                </span>
              </div>
              <div style={{ fontSize: '10px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                {body || log.message || (typeof log.data === 'string' ? log.data : '')}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default LogsList;