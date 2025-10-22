import React from 'react';
import '../../styles/FileCard.css';

interface FileCardProps {
  type: 'code' | 'uml' | 'markdown';
  language?: string;
  lineCount: number;
  title?: string;
  onClick: () => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  type,
  language,
  lineCount,
  title,
  onClick,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'uml':
        return '📊';
      case 'markdown':
        return '📝';
      default:
        return '📄';
    }
  };

  const getTitle = () => {
    if (type === 'uml') {
      return title ? `UML图 - ${title}` : 'UML图 - 未命名';
    }
    if (type === 'markdown') {
      return `md文件，共${lineCount}行`;
    }
    return `${language || 'code'}文件，共${lineCount}行`;
  };

  return (
    <div className="file-card" onClick={onClick}>
      <span className="file-icon">{getIcon()}</span>
      <span className="file-title">{getTitle()}</span>
      <span className="file-arrow">›</span>
    </div>
  );
};