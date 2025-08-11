import React, { useState, useMemo, useCallback } from 'react';
import { CodeBlockProps, CodeBlockDimensions } from './codeblock/types';
import { extractFilePath, getLineNumbers, isCodeBlockComplete } from './codeblock/pathUtils';
import CodeBlockHeader from './codeblock/CodeBlockHeader';
import CodeContent from './codeblock/CodeContent';
const CodeBlock: React.FC<CodeBlockProps> = ({ language = '', code, fullContent }) => {
  const [copied, setCopied] = useState(false);           // 右侧复制按钮动画
  const [fileNameCopied, setFileNameCopied] = useState(false); // 文件名块动画
  const [dirCopied, setDirCopied] = useState(false);     // 路径块动画
  const [saved, setSaved] = useState(false);             // 保存按钮动画（与复制解耦）
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
  // 固定宽度为 800px；不设置最小宽度
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
        dimensions={dimensions}
        setCopied={setCopied}
        setFileNameCopied={setFileNameCopied}
        setDirCopied={setDirCopied}
        setSaved={setSaved}
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