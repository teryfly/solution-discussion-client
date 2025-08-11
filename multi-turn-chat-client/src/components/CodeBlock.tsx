import React, { useState, useMemo, useCallback } from 'react';
import { CodeBlockProps, CodeBlockDimensions } from './codeblock/types';
import { extractFilePath, getLineNumbers, isCodeBlockComplete, shouldShowCodeBlock } from './codeblock/pathUtils';
import CodeBlockHeader from './codeblock/CodeBlockHeader';
import CodeContent from './codeblock/CodeContent';
const CodeBlock: React.FC<CodeBlockProps> = ({ language = '', code, fullContent }) => {
  // 检查是否应该显示代码块
  if (!shouldShowCodeBlock(code)) {
    return <span style={{ fontFamily: 'monospace', color: '#666' }}>```</span>;
  }
  const [copied, setCopied] = useState(false);
  const [fileNameCopied, setFileNameCopied] = useState(false);
  const [dirCopied, setDirCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // 新增：展开状态
  const [dimensions, setDimensions] = useState<CodeBlockDimensions>({
    isOverflow: false,
    contentHeight: 0,
    maxHeight: 300,
    isExpanded: false
  });
  // 解析路径和文件名
  const fileInfo = useMemo(() => extractFilePath(code, fullContent), [code, fullContent]);
  // 检查代码块是否完整
  const isComplete = useMemo(() => isCodeBlockComplete(fullContent, code), [fullContent, code]);
  // 渲染行号
  const lineNumbers = getLineNumbers(code);
  // 处理维度变化
  const handleDimensionsChange = useCallback((newDimensions: CodeBlockDimensions) => {
    setDimensions(prev => ({
      ...newDimensions,
      isExpanded: prev.isExpanded
    }));
  }, []);
  // 切换展开/折叠状态
  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => {
      const newExpanded = !prev;
      setDimensions(prev => ({
        ...prev,
        isExpanded: newExpanded
      }));
      return newExpanded;
    });
  }, []);
  const effectiveDimensions = {
    ...dimensions,
    isExpanded
  };
  return (
    <div
      style={{
        position: 'relative',
        border: '1px solid #ccc',
        borderRadius: 6,
        paddingTop: dimensions.isOverflow ? 76 : 32,
        marginTop: 0,
        marginBottom: 0,
        background: '#f7f7f9',
        width: '600px',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <CodeBlockHeader
        fileInfo={fileInfo}
        code={code}
        lineCount={lineNumbers.length}
        isComplete={isComplete}
        copied={copied}
        fileNameCopied={fileNameCopied}
        dirCopied={dirCopied}
        saved={saved}
        dimensions={effectiveDimensions}
        setCopied={setCopied}
        setFileNameCopied={setFileNameCopied}
        setDirCopied={setDirCopied}
        setSaved={setSaved}
        onToggleExpand={dimensions.isOverflow ? handleToggleExpand : undefined}
      />
      <CodeContent
        code={code}
        language={language}
        lineNumbers={lineNumbers}
        isComplete={isComplete}
        isExpanded={isExpanded}
        onDimensionsChange={handleDimensionsChange}
      />
    </div>
  );
};
export default CodeBlock;