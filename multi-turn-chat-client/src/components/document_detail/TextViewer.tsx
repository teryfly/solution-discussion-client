import React, { useMemo } from 'react';

interface TextViewerProps {
  content: string;
  codeFontFamily: string;
  lineColRef: React.RefObject<HTMLDivElement>;
  contentColRef: React.RefObject<HTMLDivElement>;
}

const TextViewer: React.FC<TextViewerProps> = ({ 
  content, 
  codeFontFamily, 
  lineColRef, 
  contentColRef 
}) => {
  const rawLines = useMemo(() => (content || '').split('\n'), [content]);
  const lineNumbers = useMemo(
    () => Array.from({ length: rawLines.length }, (_, i) => i + 1),
    [rawLines.length]
  );

  return (
    <>
      <div
        ref={lineColRef}
        style={{
          userSelect: 'none',
          background: '#f0f0f6',
          color: '#aaa',
          textAlign: 'right',
          padding: '12px 8px 12px 6px',
          borderRight: '1px solid #e3e3e8',
          minWidth: 60,
          maxWidth: 60,
          fontFamily: codeFontFamily,
          fontSize: 12,
          lineHeight: 1.55,
          letterSpacing: '0.02em',
          flexShrink: 0,
          overflowY: 'hidden',
          overflowX: 'hidden',
        }}
        aria-hidden="true"
      >
        {lineNumbers.map((n) => (
          <div key={n}>{n}</div>
        ))}
      </div>
      <div
        ref={contentColRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 12,
          fontSize: 13,
          lineHeight: 1.55,
          minHeight: 0,
        }}
      >
        <pre
          style={{
            margin: 0,
            background: 'transparent',
            border: 'none',
            padding: 0,
            whiteSpace: 'pre',
            fontFamily: codeFontFamily,
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          <code style={{ fontFamily: codeFontFamily }}>{content}</code>
        </pre>
      </div>
    </>
  );
};

export default TextViewer;