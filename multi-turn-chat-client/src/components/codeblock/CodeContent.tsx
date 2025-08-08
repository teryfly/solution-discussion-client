import React from 'react';

interface CodeContentProps {
  code: string;
  language: string;
  lineNumbers: number[];
  isComplete: boolean;
}

const CodeContent: React.FC<CodeContentProps> = ({ code, language, lineNumbers, isComplete }) => {
  return (
    <>
      {/* 代码区 */}
      <div
        style={{
          maxHeight: '300px',
          overflow: 'auto',
          display: 'flex',
          fontSize: 14,
          lineHeight: 1.5,
          background: 'transparent',
          width: '100%',
          scrollBehavior: 'smooth'
        }}
      >
        <div
          style={{
            userSelect: 'none',
            background: '#f0f0f6',
            color: '#aaa',
            textAlign: 'right',
            padding: '12px 8px 12px 6px',
            borderRight: '1px solid #e3e3e8',
            minWidth: 50,
            maxWidth: 60,
            fontFamily: 'monospace',
            fontSize: 13,
            lineHeight: '1.5',
            letterSpacing: '0.02em',
            flexShrink: 0
          }}
          aria-hidden="true"
        >
          {lineNumbers.map((n) => (
            <div key={n}>{n}</div>
          ))}
        </div>
        <pre
          style={{
            margin: 0,
            padding: '12px',
            background: 'transparent',
            overflow: 'visible',
            flex: 1,
            fontFamily: 'monospace',
            fontSize: 14,
            minWidth: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          <code className={`language-${language}`}>
            {code}
          </code>
        </pre>
      </div>
      
      {/* 输入状态指示器 */}
      {!isComplete && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            fontSize: 11,
            color: '#888',
            background: 'rgba(255,255,255,0.8)',
            padding: '2px 6px',
            borderRadius: 3,
            border: '1px solid #ddd'
          }}
        >
          正在输入...
        </div>
      )}
    </>
  );
};

export default CodeContent;