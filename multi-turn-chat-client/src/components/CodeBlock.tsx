import React, { useRef, useState, useEffect } from 'react';

interface CodeBlockProps {
  language?: string;
  code: string;
}

function getLineNumbers(code: string) {
  const count = code.split('\n').length;
  return Array.from({ length: count }, (_, i) => i + 1);
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language = '', code }) => {
  const preRef = useRef<HTMLPreElement>(null);
  const codeWrapperRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [prevCode, setPrevCode] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);

  // 检查代码是否完整（通过检查是否有明显的结束标记或者代码长度变化）
  useEffect(() => {
    const trimmedCode = code.trim();
    const hasEndingMarkers = /[;})\]]\s*$/.test(trimmedCode) || 
                            trimmedCode.endsWith('```') ||
                            trimmedCode.endsWith('---');
    const codeUnchanged = prevCode === code && prevCode.length > 0;
    setIsComplete(hasEndingMarkers || codeUnchanged);
    setPrevCode(code);
  }, [code, prevCode]);

  // 复制时去除行号
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  // 渲染行号
  const lines = getLineNumbers(code);

  return (
    <div
      style={{
        position: 'relative',
        border: '1px solid #ccc',
        borderRadius: 6,
        paddingTop: 32,
        marginTop: 12,
        marginBottom: 12,
        background: '#f7f7f9',
        width: '100%',
        maxWidth: '800px',
        minWidth: '400px',
        overflow: 'hidden'
      }}
    >
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
          gap: 4,
          zIndex: 10
        }}
      >
        {copied ? (
          <span style={{ fontSize: 14 }}>✅</span>
        ) : (
          <span style={{ fontSize: 14 }}>📋</span>
        )}
        {copied ? '已复制' : '复制'}
      </button>
      <div
        ref={codeWrapperRef}
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
          {lines.map((n) => (
            <div key={n}>{n}</div>
          ))}
        </div>
        <pre
          ref={preRef}
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
    </div>
  );
};

export default CodeBlock;