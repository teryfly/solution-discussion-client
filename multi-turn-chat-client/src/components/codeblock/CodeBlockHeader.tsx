import React, { useRef } from 'react';
import { FilePathInfo, CodeBlockDimensions } from './types';
import { handleFileBlockCopy, handleDirBlockCopy, handleCopyCode } from './copyHandlers';
interface CodeBlockHeaderProps {
  fileInfo: FilePathInfo;
  code: string;
  lineCount: number;
  isComplete: boolean;
  copied: boolean;
  fileCopied: boolean;
  dirCopied: boolean;
  dimensions: CodeBlockDimensions;
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
  dimensions,
  setCopied,
  setFileCopied,
  setDirCopied,
}) => {
  const { dirPath, fileName } = fileInfo;
  const { isOverflow } = dimensions;
  const saveAnimTimeout = useRef<NodeJS.Timeout | null>(null);
  const handleCopy = () => handleCopyCode(code, setCopied);
  const handleFileCopy = () => handleFileBlockCopy(code, fileName, setCopied, setFileCopied, setDirCopied);
  const handleDirCopy = () => handleDirBlockCopy(code, dirPath, fileName, setCopied, setFileCopied, setDirCopied);
  // 保存到本地，保存成功后按钮变绿动画，无alert
  const handleSaveLocal = async () => {
    if (!fileName) {
      alert('无法确定默认文件名');
      return;
    }
    try {
      if ('showSaveFilePicker' in window) {
        const extMatch = fileName.match(/\.([a-zA-Z0-9]+)$/);
        const extension = extMatch ? `.${extMatch[1]}` : '';
        const mime =
          extension === '.js' ? 'application/javascript'
          : extension === '.ts' ? 'application/typescript'
          : extension === '.json' ? 'application/json'
          : extension === '.py' ? 'text/x-python'
          : extension === '.java' ? 'text/x-java-source'
          : extension === '.css' ? 'text/css'
          : extension === '.html' ? 'text/html'
          : extension === '.md' ? 'text/markdown'
          : 'text/plain';
        const opts = {
          suggestedName: fileName,
          types: [
            extension
              ? {
                  description: `${extension} 文件`,
                  accept: { [mime]: [extension] }
                }
              : {
                  description: '所有文件',
                  accept: { 'text/plain': ['.txt'] }
                }
          ]
        };
        // @ts-ignore
        const handle = await window.showSaveFilePicker(opts);
        const writable = await handle.createWritable();
        await writable.write(code);
        await writable.close();
        // 动画
        setFileCopied(true);
        if (saveAnimTimeout.current) clearTimeout(saveAnimTimeout.current);
        saveAnimTimeout.current = setTimeout(() => setFileCopied(false), 1200);
      } else {
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        setFileCopied(true);
        if (saveAnimTimeout.current) clearTimeout(saveAnimTimeout.current);
        saveAnimTimeout.current = setTimeout(() => setFileCopied(false), 1200);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        alert('保存失败: ' + (e.message || e));
      }
    }
  };
  const handleGit = () => window.alert('开发中...');
  const handleView = () => {
    const escapeHtml = (text: string) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };
    const escapedCode = escapeHtml(code);
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${fileName || 'Code View'}</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/default.min.css">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
          </head>
          <body>
            <pre><code class="language-${fileName?.split('.').pop() || 'plaintext'}">${escapedCode}</code></pre>
            <script>hljs.highlightAll();</script>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'absolute',
        top: 4,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: 'white',
        borderBottom: '1px solid #eee',
        padding: 0,
        margin: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', padding: '4px 8px', gap: 4, margin: 0 }}>
        {dirPath && (
          <>
            <span
              onClick={handleDirCopy}
              style={{
                padding: '2px 6px',
                background: dirCopied ? '#4caf50' : '#e0e7ee',
                color: dirCopied ? '#fff' : '#222',
                borderRadius: 5,
                fontSize: 13,
                fontFamily: 'monospace',
                cursor: 'pointer',
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
              padding: '2px 6px',
              background: fileCopied ? '#4caf50' : '#e0e7ee',
              color: fileCopied ? '#fff' : '#222',
              borderRadius: 5,
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'monospace',
              cursor: 'pointer',
              userSelect: 'text'
            }}
            title={fileName}
          >
            {fileName}
          </span>
        )}
        {!isOverflow && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? '#4caf50' : '#1a73e8',
                color: '#fff',
                border: 'none',
                padding: '4px',
                borderRadius: 4,
                cursor: 'pointer'
              }}
              title="复制代码"
            >
              📋
            </button>
            <button
              onClick={handleSaveLocal}
              style={{
                background: fileCopied ? '#4caf50' : '#1a73e8',
                color: '#fff',
                border: 'none',
                padding: '4px',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background 0.18s'
              }}
              title="保存本地"
            >
              💾
            </button>
            <button
              onClick={handleGit}
              style={{
                background: '#1a73e8',
                color: '#fff',
                border: 'none',
                padding: '4px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              title="Git"
            >
              🌐
            </button>
          </div>
        )}
      </div>
      {isOverflow && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px' }}>
          <div style={{ fontSize: 13, fontFamily: 'monospace' }}>
            {isComplete ? `共${lineCount}行代码` : `正在写入第${lineCount}行代码`}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? '#4caf50' : '#1a73e8',
                color: '#fff',
                border: 'none',
                padding: '4px',
                borderRadius: 4,
                cursor: 'pointer'
              }}
              title="复制代码"
            >
              📋
            </button>
            <button
              onClick={handleSaveLocal}
              style={{
                background: fileCopied ? '#4caf50' : '#1a73e8',
                color: '#fff',
                border: 'none',
                padding: '4px',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'background 0.18s'
              }}
              title="保存本地"
            >
              💾
            </button>
            <button
              onClick={handleGit}
              style={{
                background: '#1a73e8',
                color: '#fff',
                border: 'none',
                padding: '4px',
                borderRadius: 4,
                cursor: 'pointer'
              }}
              title="Git"
            >
              🌐
            </button>
            <button
              onClick={handleView}
              style={{
                background: '#1a73e8',
                color: '#fff',
                border: 'none',
                padding: '4px',
                borderRadius: 4,
                cursor: 'pointer'
              }}
              title="查看"
            >
              👀
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default CodeBlockHeader;