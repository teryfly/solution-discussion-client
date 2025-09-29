import React, { useEffect, useRef, useState } from 'react';
import { DocumentViewerProps } from './types';
import { detectDocumentFormat } from './formatDetection';
import PlantUMLViewer from './PlantUMLViewer';
import MarkdownViewer from './MarkdownViewer';
import TextViewer from './TextViewer';
import DualPaneEditor from './DualPaneEditor';

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  content,
  filename,
  loading,
  editMode,
  saving,
  onContentChange,
  lineColRef,
  contentColRef,
  textareaRef,
}) => {
  const codeFontFamily = "'Consolas','Monaco','Courier New','Liberation Mono','DejaVu Sans Mono',monospace";
  const format = detectDocumentFormat(filename, content);

  if (loading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          color: '#888',
        }}
      >
        加载中...
      </div>
    );
  }

  // 编辑模式：使用双栏编辑器
  if (editMode) {
    return (
      <DualPaneEditor
        content={content}
        filename={filename}
        onContentChange={onContentChange}
        placeholder="请输入文档内容，支持Markdown与PlantUML(@startuml ... @enduml)"
        disabled={saving}
        showPreview={true}
        initialLeftRatio={0.4}
      />
    );
  }

  // 非编辑模式：按旧的单视图展示
  const containerStyle = {
    flex: 1,
    display: 'flex' as const,
    background: '#fafafa',
    borderRadius: 8,
    border: '1px solid #eee',
    overflow: 'hidden' as const,
    margin: 12,
    minHeight: 0,
  };

  if (format === 'plantuml') {
    return (
      <div style={containerStyle}>
        <PlantUMLViewer content={content || ''} codeFontFamily={codeFontFamily} />
      </div>
    );
  }

  if (format === 'markdown') {
    return (
      <div style={containerStyle}>
        <div
          ref={contentColRef}
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 12,
            fontSize: 13,
            lineHeight: 1.55,
            minHeight: 0,
          }}
        >
          <MarkdownViewer content={content || ''} codeFontFamily={codeFontFamily} />
        </div>
      </div>
    );
  }

  // Plain text with line numbers
  return (
    <div style={containerStyle}>
      <TextViewer
        content={content || ''}
        codeFontFamily={codeFontFamily}
        lineColRef={lineColRef}
        contentColRef={contentColRef}
      />
    </div>
  );
};

export default DocumentViewer;