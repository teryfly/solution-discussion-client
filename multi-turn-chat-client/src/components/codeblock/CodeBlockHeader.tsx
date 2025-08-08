import React from 'react';
import { FilePathInfo } from './types';
import { handleFileBlockCopy, handleDirBlockCopy, handleCopyCode } from './copyHandlers';

interface CodeBlockHeaderProps {
  fileInfo: FilePathInfo;
  code: string;
  lineCount: number;
  isComplete: boolean;
  copied: boolean;
  fileCopied: boolean;
  dirCopied: boolean;
  setCopied: (value: boolean) => void;
  setFileCopied: (value: boolean) => void;
  setDirCopied: (value: boolean) => void;
}

const CodeBlockHeader: React.FC<CodeBlockHeaderProps> = ({
  fileInfo,
  code,
  lineCount,
  isComplete,
  copied,
  fileCopied,
  dirCopied,
  setCopied,
  setFileCopied,
  setDirCopied
}) => {
  const { dirPath, fileName } = fileInfo;

  const handleCopy = () => handleCopyCode(code, setCopied);
  
  const handleFileCopy = () => handleFileBlockCopy(
    code, fileName, setCopied, setFileCopied, setDirCopied
  );
  
  const handleDirCopy = () => handleDirBlockCopy(
    code, dirPath, fileName, setCopied, setFileCopied, setDirCopied
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 4,
        left: 0,
        right: 0,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        zIndex: 10,
        pointerEvents: 'none'
      }}
    >
      {/* 左区：路径和文件名块 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 8, gap: 4, pointerEvents: 'auto', minWidth: 0 }}>
        {dirPath && (
          <>
            <span
              onClick={handleDirCopy}
              style={{
                display: 'inline-block',
                padding: '2px 10px',
                background: dirCopied ? '#4caf50' : '#e0e7ee',
                color: dirCopied ? '#fff' : '#222',
                borderRadius: 5,
                fontSize: 13,
                fontWeight: 500,
                fontFamily: 'monospace',
                cursor: 'pointer',
                border: 'none',
                marginRight: 2,
                transition: 'background 0.18s, color 0.18s',
                maxWidth: 110,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                verticalAlign: 'middle',
                userSelect: 'text'
              }}
              title={dirPath}
            >
              {dirPath}
            </span>
            <span style={{ color: '#aaa', fontWeight: 900, fontSize: 13 }}>/</span>
          </>
        )}
        {fileName && (
          <span
            onClick={handleFileCopy}
            style={{
              display: 'inline-block',
              padding: '2px 10px',
              background: fileCopied ? '#4caf50' : '#e0e7ee',
              color: fileCopied ? '#fff' : '#222',
              borderRadius: 5,
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'monospace',
              cursor: 'pointer',
              border: 'none',
              transition: 'background 0.18s, color 0.18s',
              maxWidth: 110,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              verticalAlign: 'middle',
              userSelect: 'text'
            }}
            title={fileName}
          >
            {fileName}
          </span>
        )}
      </div>
      
      {/* 中区：代码行数状态 */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
        color: isComplete ? '#333' : '#666',
        fontSize: 13,
        fontFamily: 'monospace',
        fontWeight: isComplete ? 600 : 400,
        letterSpacing: '0.02em'
      }}>
        {isComplete ? (
          <span style={{ fontWeight: 'bold' }}>共{lineCount}行代码</span>
        ) : (
          <span>正在写入第{lineCount}行代码</span>
        )}
      </div>
      
      {/* 右区：复制代码按钮 */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 8, pointerEvents: 'auto' }}>
        <button
          onClick={handleCopy}
          style={{
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
            fontWeight: 500
          }}
        >
          {copied ? (
            <span style={{ fontSize: 14 }}>✅</span>
          ) : (
            <span style={{ fontSize: 14 }}>📋</span>
          )}
          {copied ? '已复制' : '复制'}
        </button>
      </div>
    </div>
  );
};

export default CodeBlockHeader;