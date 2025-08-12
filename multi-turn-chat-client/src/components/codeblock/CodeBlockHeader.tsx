import React, { useRef, useEffect } from 'react';
import { FilePathInfo, CodeBlockDimensions } from './types';
import { handleFileBlockCopy, handleDirBlockCopy, handleCopyCode } from './copyHandlers';
import { useProject } from '../../context/ProjectContext';
import { buildDisplayFileName, buildFullPath } from '../../utils/pathHelpers';
import { navigationManager } from '../../utils/codeBlockNavigation';
interface CodeBlockHeaderProps {
  fileInfo: FilePathInfo;
  code: string;
  lineCount: number;
  isComplete: boolean;
  copied: boolean;
  fileNameCopied: boolean;
  dirCopied: boolean;
  saved: boolean;
  dimensions: CodeBlockDimensions;
  setCopied: (value: boolean) => void;
  setFileNameCopied: (value: boolean) => void;
  setDirCopied: (value: boolean) => void;
  setSaved: (value: boolean) => void;
  onToggleExpand?: () => void; // 新增：展开/折叠回调
}
// 眼睛图标组件（展开/折叠）
const EyeIcon: React.FC<{ isExpanded: boolean }> = ({ isExpanded }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    {isExpanded ? (
      // 睁眼图标
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      // 闭眼图标
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);
// 新窗口图标组件（斜箭头）
const ExternalLinkIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15,3 21,3 21,9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);
const CodeBlockHeader: React.FC<CodeBlockHeaderProps> = ({
  fileInfo,
  code,
  lineCount,
  isComplete,
  copied,
  fileNameCopied,
  dirCopied,
  saved,
  dimensions,
  setCopied,
  setFileNameCopied,
  setDirCopied,
  setSaved,
  onToggleExpand,
}) => {
  const { dirPath, fileName } = fileInfo;
  const { isOverflow, isExpanded = false } = dimensions;
  const saveAnimTimeout = useRef<NodeJS.Timeout | null>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const saveButtonOverflowRef = useRef<HTMLButtonElement>(null);
  const { getAiWorkDir } = useProject();
  // 注册/注销保存按钮到导航管理器
  useEffect(() => {
    const currentSaveButton = isOverflow ? saveButtonOverflowRef.current : saveButtonRef.current;
    if (currentSaveButton) {
      navigationManager.registerSaveButton(currentSaveButton);
    }
    return () => {
      if (currentSaveButton) {
        navigationManager.unregisterSaveButton(currentSaveButton);
      }
    };
  }, [isOverflow]);
  // 组件卸载时清理
  useEffect(() => {
    return () => {
      const normalButton = saveButtonRef.current;
      const overflowButton = saveButtonOverflowRef.current;
      if (normalButton) {
        navigationManager.unregisterSaveButton(normalButton);
      }
      if (overflowButton) {
        navigationManager.unregisterSaveButton(overflowButton);
      }
    };
  }, []);
  const handleCopy = () => handleCopyCode(code, setCopied);
  const handleFileCopy = () =>
    handleFileBlockCopy(code, fileName, setCopied, setFileNameCopied, setDirCopied);
  const handleDirCopy = () =>
    handleDirBlockCopy(code, dirPath, fileName, setCopied, setFileNameCopied, setDirCopied);
  // 保存到本地
  const handleSaveLocal = async (buttonRef: React.RefObject<HTMLButtonElement>) => {
    if (!fileName) {
      alert('无法确定默认文件名');
      return;
    }
    // 激活键盘导航
    if (buttonRef.current) {
      navigationManager.activateNavigation(buttonRef.current);
    }
    try {
      const aiWorkDir = getAiWorkDir();
      let fullPath = fileName;
      if (aiWorkDir) {
        fullPath = buildFullPath(aiWorkDir, dirPath, fileName);
      }
      try {
        await navigator.clipboard.writeText(fullPath);
      } catch (e) {
        console.warn('复制完整路径到剪贴板失败:', e);
      }
      const suggestedName = '请直接粘贴完整路径(CTRL+V)';
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
          suggestedName,
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
        setSaved(true);
        if (saveAnimTimeout.current) clearTimeout(saveAnimTimeout.current);
        saveAnimTimeout.current = setTimeout(() => setSaved(false), 1200);
      } else {
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = suggestedName;
        a.click();
        URL.revokeObjectURL(url);
        setSaved(true);
        if (saveAnimTimeout.current) clearTimeout(saveAnimTimeout.current);
        saveAnimTimeout.current = setTimeout(() => setSaved(false), 1200);
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        alert('保存失败: ' + (e.message || e));
      }
    }
  };
  const handleGit = () => window.alert('开发中...');
  // 新窗口查看（添加行号和高亮）
  const handleView = () => {
    const escapeHtml = (text: string) => {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };
    const escapedCode = escapeHtml(code);
    const language = fileName?.split('.').pop() || 'plaintext';
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${fileName || 'Code View'}</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/default.min.css">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
            <style>
              body {
                margin: 0;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                background: #f8f9fa;
              }
              .code-container {
                display: flex;
                background: white;
                border-radius: 8px;
                margin: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                overflow: hidden;
              }
              .line-numbers {
                background: #f0f0f6;
                color: #aaa;
                text-align: right;
                padding: 16px 12px;
                border-right: 1px solid #e3e3e8;
                min-width: 60px;
                font-size: 14px;
                line-height: 1.5;
                user-select: none;
                white-space: pre;
              }
              .code-content {
                flex: 1;
                padding: 16px;
                overflow: auto;
                font-size: 14px;
                line-height: 1.5;
              }
              .code-content pre {
                margin: 0;
                white-space: pre-wrap;
                word-break: break-word;
              }
              .header {
                background: #1a73e8;
                color: white;
                padding: 12px 20px;
                font-weight: 500;
                margin: 0;
              }
            </style>
          </head>
          <body>
            <div class="header">${fileName || 'Code View'}</div>
            <div class="code-container">
              <div class="line-numbers">${code.split('\n').map((_, i) => i + 1).join('\n')}</div>
              <div class="code-content">
                <pre><code class="language-${language}">${escapedCode}</code></pre>
              </div>
            </div>
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
              background: fileNameCopied ? '#4caf50' : '#e0e7ee',
              color: fileNameCopied ? '#fff' : '#222',
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
              ref={saveButtonRef}
              onClick={() => handleSaveLocal(saveButtonRef)}
              style={{
                background: saved ? '#4caf50' : '#1a73e8',
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
            {onToggleExpand && (
              <button
                onClick={onToggleExpand}
                style={{
                  background: '#1a73e8',
                  color: '#fff',
                  border: 'none',
                  padding: '4px 6px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={isExpanded ? '折叠代码' : '展开代码'}
              >
                <EyeIcon isExpanded={isExpanded} />
              </button>
            )}
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
              ref={saveButtonOverflowRef}
              onClick={() => handleSaveLocal(saveButtonOverflowRef)}
              style={{
                background: saved ? '#4caf50' : '#1a73e8',
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
                padding: '4px 6px',
                borderRadius: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="新窗口查看"
            >
              <ExternalLinkIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default CodeBlockHeader;