import React, { useRef, useState } from 'react';

interface CodeBlockProps {
  language?: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language = '', code }) => {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200); // 1.2秒后恢复
    });
  };

  return (
    <div style={{
      position: 'relative',
      border: '1px solid #ccc',
      borderRadius: 6,
      paddingTop: 32,
      marginTop: 12,
      marginBottom: 12,
      background: '#f7f7f9'
    }}>
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute',
          top: 4,
          right: 8,
          fontSize: 12,
          background: copied ? '#4caf50' : '#1a73e8',
          color: '#fff',
          border: 'none',
          padding: '4px 8px',
          borderRadius: 4,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}
      >
        {copied ? (
          <span style={{ fontSize: 14 }}>✅</span>
        ) : (
          <span style={{ fontSize: 14 }}>📋</span>
        )}
        {copied ? '已复制' : '复制'}
      </button>
      <pre
        ref={ref}
        style={{
          maxHeight: '10em',
          overflow: 'auto',
          padding: '12px',
          fontSize: 14,
          lineHeight: 1.5,
          margin: 0
        }}
      >
        <code className={`language-${language}`}>
          {code}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;