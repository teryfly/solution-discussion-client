// src/components/CodeBlock.tsx
import React, { useRef } from 'react';

interface CodeBlockProps {
  language?: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language = '', code }) => {
  const ref = useRef<HTMLPreElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      alert('代码已复制到剪贴板');
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
          background: '#1a73e8',
          color: '#fff',
          border: 'none',
          padding: '4px 8px',
          borderRadius: 4,
          cursor: 'pointer'
        }}
      >
        复制
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
