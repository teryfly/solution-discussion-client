import React, { useState, useMemo } from 'react';
import { CodeBlockProps } from './codeblock/types';
import { extractFilePath, getLineNumbers, isCodeBlockComplete } from './codeblock/pathUtils';
import CodeBlockHeader from './codeblock/CodeBlockHeader';
import CodeContent from './codeblock/CodeContent';

const CodeBlock: React.FC<CodeBlockProps> = ({ language = '', code, fullContent }) => {
  const [copied, setCopied] = useState(false);
  const [fileCopied, setFileCopied] = useState(false);
  const [dirCopied, setDirCopied] = useState(false);

  // 解析路径和文件名
  const fileInfo = useMemo(() => extractFilePath(code, fullContent), [code, fullContent]);

  // 检查代码块是否完整（基于成对的```标记）
  const isComplete = useMemo(() => isCodeBlockComplete(fullContent, code), [fullContent, code]);

  // 渲染行号
  const lineNumbers = getLineNumbers(code);

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
      <CodeBlockHeader
        fileInfo={fileInfo}
        code={code}
        lineCount={lineNumbers.length}
        isComplete={isComplete}
        copied={copied}
        fileCopied={fileCopied}
        dirCopied={dirCopied}
        setCopied={setCopied}
        setFileCopied={setFileCopied}
        setDirCopied={setDirCopied}
      />
      
      <CodeContent
        code={code}
        language={language}
        lineNumbers={lineNumbers}
        isComplete={isComplete}
      />
    </div>
  );
};

export default CodeBlock;