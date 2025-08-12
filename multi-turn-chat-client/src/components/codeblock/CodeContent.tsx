import React, { useRef, useState, useLayoutEffect } from 'react';
import { CodeBlockDimensions } from './types';
interface CodeContentProps {
  code: string;
  language: string;
  lineNumbers: number[];
  isComplete: boolean;
  isExpanded?: boolean;
  onDimensionsChange: (dimensions: CodeBlockDimensions) => void;
}
const MAX_HEIGHT = 300;
const EXPANDED_MAX_HEIGHT = 600; // 展开状态下的最大高度
const CodeContent: React.FC<CodeContentProps> = ({
  code,
  language,
  lineNumbers,
  isComplete,
  isExpanded = false,
  onDimensionsChange
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflow, setIsOverflow] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  useLayoutEffect(() => {
    if (contentRef.current) {
      const tempDiv = document.createElement('div');
      tempDiv.style.cssText = `
        position: absolute;
        visibility: hidden;
        pointer-events: none;
        top: -9999px;
        left: -9999px;
        width: ${contentRef.current.offsetWidth}px;
        font-family: monospace;
        font-size: 14px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-word;
        padding: 12px;
      `;
      const lineNumberWidth = 60;
      tempDiv.style.width = `${contentRef.current.offsetWidth - lineNumberWidth}px`;
      tempDiv.textContent = code;
      document.body.appendChild(tempDiv);
      const contentHeight = tempDiv.scrollHeight + 24;
      const isContentOverflow = contentHeight > MAX_HEIGHT;
      document.body.removeChild(tempDiv);
      setIsOverflow(isContentOverflow);
      setIsInitialized(true);
      onDimensionsChange({
        isOverflow: isContentOverflow,
        contentHeight,
        maxHeight: MAX_HEIGHT,
        isExpanded
      });
    }
  }, [code, isExpanded, onDimensionsChange]);
  if (!isInitialized) {
    return (
      <div
        ref={contentRef}
        style={{
          maxHeight: MAX_HEIGHT,
          overflow: 'hidden',
          display: 'flex',
          fontSize: 14,
          lineHeight: 1.5,
          background: 'transparent',
          width: '100%',
          visibility: 'hidden'
        }}
      >
        <div style={{ minWidth: 60, flexShrink: 0 }}></div>
        <pre style={{ margin: 0, padding: '12px', flex: 1 }}>
          <code>{code}</code>
        </pre>
      </div>
    );
  }
  if (isOverflow && !isExpanded) {
    return null;
  }
  const effectiveMaxHeight = isExpanded
    ? EXPANDED_MAX_HEIGHT
    : MAX_HEIGHT;
  return (
    <div
      ref={contentRef}
      style={{
        maxHeight: effectiveMaxHeight,
        overflowY: 'auto',
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
  );
};
export default CodeContent;