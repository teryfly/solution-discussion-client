import React, { useState, useMemo, useCallback } from 'react';
import { CodeBlockProps, CodeBlockDimensions } from './codeblock/types';
import { extractFilePath, getLineNumbers, isCodeBlockComplete } from './codeblock/pathUtils';
import CodeBlockHeader from './codeblock/CodeBlockHeader';
import CodeContent from './codeblock/CodeContent';

const CodeBlock: React.FC<CodeBlockProps> = ({ language = '', code, fullContent }) => {
  const [copied, setCopied] = useState(false);
  const [fileCopied, setFileCopied] = useState(false);
  const [dirCopied, setDirCopied] = useState(false);
  const [dimensions, setDimensions] = useState<CodeBlockDimensions>({
    isOverflow: false,
    contentHeight: 0,
    maxHeight: 300
  });

  // 解析路径和文件名
  const fileInfo = useMemo(() => extractFilePath(code, fullContent), [code, fullContent]);

  // 检查代码块是否完整（基于成对的```标记）
  const isComplete = useMemo(() => isCodeBlockComplete(fullContent, code), [fullContent, code]);

  // 渲染行号
  const lineNumbers = getLineNumbers(code);

  // 处理维度变化
  const handleDimensionsChange = useCallback((newDimensions: CodeBlockDimensions) => {
    setDimensions(newDimensions);
  }, []);

  // 主要样式调整：外边距和内边距全部清零，宽度适应父容器
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
        width: '100%',
        maxWidth: '800px',
        minWidth: 0,
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
        fileCopied={fileCopied}
        dirCopied={dirCopied}
        dimensions={dimensions}
        setCopied={setCopied}
        setFileCopied={setFileCopied}
        setDirCopied={setDirCopied}
      />
      
      <CodeContent
        code={code}
        language={language}
        lineNumbers={lineNumbers}
        isComplete={isComplete}
        onDimensionsChange={handleDimensionsChange}
      />
    </div>
  );
};

export default CodeBlock;