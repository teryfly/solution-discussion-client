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
  const [hasScrolled, setHasScrolled] = useState(false);

  // 检查代码是否完整（通过检查是否有明显的结束标记或者代码长度变化）
  useEffect(() => {
    // 如果代码以常见的结束标记结尾，认为是完整的
    const trimmedCode = code.trim();
    const hasEndingMarkers = /[;})\]]\s*$/.test(trimmedCode) || 
                            trimmedCode.endsWith('```') ||
                            trimmedCode.endsWith('---');
    
    // 如果代码长度在一段时间内没有变化，也认为是完整的
    const codeUnchanged = prevCode === code && prevCode.length > 0;
    
    setIsComplete(hasEndingMarkers || codeUnchanged);
  }, [code, prevCode]);

  // 自动滚动到底部逻辑 - 只对未完成的代码块生效
  useEffect(() => {
    if (!isComplete && prevCode !== code && codeWrapperRef.current) {
      const wrapper = codeWrapperRef.current;
      const { scrollTop, scrollHeight, clientHeight } = wrapper;
      
      // 只有当用户没有手动滚动过，或者已经在底部时才自动滚动
      const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 10;
      const shouldAutoScroll = !hasScrolled || isAtBottom;
      
      if (shouldAutoScroll) {
        wrapper.scrollTop = wrapper.scrollHeight;
      }
      
      setPrevCode(code);
    }
  }, [code, prevCode, isComplete, hasScrolled]);

  // 监听用户手动滚动
  useEffect(() => {
    const wrapper = codeWrapperRef.current;
    if (!wrapper) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = wrapper;
      const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 10;
      
      // 如果用户滚动到非底部位置，标记为已手动滚动
      if (!isAtBottom) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    };

    wrapper.addEventListener('scroll', handleScroll);
    return () => wrapper.removeEventListener('scroll', handleScroll);
  }, []);

  // 复制时去除行号
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200); // 1.2秒后恢复
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
        width: '100%', // 固定宽度为100%
        maxWidth: '800px', // 设置最大宽度
        minWidth: '400px', // 设置最小宽度
        overflow: 'hidden' // 防止内容溢出
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
          maxHeight: '400px', // 增加最大高度
          overflow: 'auto',
          display: 'flex',
          fontSize: 14,
          lineHeight: 1.5,
          background: 'transparent',
          width: '100%' // 确保wrapper也是固定宽度
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
            minWidth: 50, // 固定行号区域最小宽度
            maxWidth: 60, // 固定行号区域最大宽度
            fontFamily: 'monospace',
            fontSize: 13,
            lineHeight: '1.5',
            letterSpacing: '0.02em',
            flexShrink: 0 // 防止行号区域被压缩
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
            minWidth: 0, // 允许内容被压缩
            whiteSpace: 'pre-wrap', // 允许换行
            wordBreak: 'break-word' // 长单词换行
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