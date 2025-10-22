import React from 'react';
import '../../styles/CodeDrawer.css';

interface CodeDrawerProps {
  code: string;
  language: string;
  onClose: () => void;
}

export const CodeDrawer: React.FC<CodeDrawerProps> = ({
  code,
  language,
  onClose,
}) => {
  const lines = code.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content code-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title">
            <span className="language-badge">{language}</span>
            <span className="line-count">{lines.length} 行</span>
          </div>
          <div className="drawer-actions">
            <button className="drawer-btn" onClick={handleCopy}>
              📋 复制
            </button>
            <button className="drawer-btn close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>
        <div className="drawer-body">
          <div className="code-container">
            <div className="line-numbers">
              {lines.map((_, index) => (
                <div key={index} className="line-number">
                  {index + 1}
                </div>
              ))}
            </div>
            <pre className="code-content">
              <code>{code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};