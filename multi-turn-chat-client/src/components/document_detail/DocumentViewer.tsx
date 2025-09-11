import React, { useEffect, useRef, useState } from 'react';
import { DocumentViewerProps } from './types';
import { detectDocumentFormat } from './formatDetection';
import PlantUMLViewer from './PlantUMLViewer';
import MarkdownViewer from './MarkdownViewer';
import TextViewer from './TextViewer';

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
  const [leftRatio, setLeftRatio] = useState(0.4); // 默认左40%
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ dragging: boolean; startX: number; startRatio: number }>({
    dragging: false,
    startX: 0,
    startRatio: 0.4,
  });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragState.current.dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = e.clientX - dragState.current.startX;
      const newRatio = Math.min(0.8, Math.max(0.2, dragState.current.startRatio + dx / rect.width));
      setLeftRatio(newRatio);
      e.preventDefault();
    };
    const onUp = () => {
      if (dragState.current.dragging) {
        dragState.current.dragging = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const startDrag = (e: React.MouseEvent) => {
    dragState.current.dragging = true;
    dragState.current.startX = e.clientX;
    dragState.current.startRatio = leftRatio;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

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

  // 编辑模式：左右分栏（左侧编辑器，右侧自动预览，支持拖拽分隔线）
  if (editMode) {
    return (
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          padding: 12,
          boxSizing: 'border-box',
          minHeight: 0,
          gap: 0,
        }}
      >
        {/* 左侧：原始内容编辑器 */}
        <div style={{ width: `${leftRatio * 100}%`, minWidth: 100, display: 'flex' }}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '12px',
              border: '2px solid #e0e0e0',
              borderRadius: 8,
              fontSize: 13,
              fontFamily: codeFontFamily,
              lineHeight: 1.55,
              resize: 'none',
              boxSizing: 'border-box',
              outline: 'none',
              whiteSpace: 'pre',
              background: '#fff',
            }}
            placeholder="请输入文档内容，支持Markdown与PlantUML(@startuml ... @enduml)"
            disabled={saving}
          />
        </div>

        {/* 分隔线（可拖拽） */}
        <div
          onMouseDown={startDrag}
          title="拖动调整左右宽度"
          style={{
            width: 6,
            cursor: 'col-resize',
            margin: '0 8px',
            background: 'linear-gradient(180deg, #e0e0e0, #cfcfcf)',
            borderRadius: 4,
            flexShrink: 0,
          }}
        />

        {/* 右侧：实时预览（根据内容自动识别渲染器） */}
        <div
          style={{
            width: `${(1 - leftRatio) * 100}%`,
            minWidth: 140,
            display: 'flex',
            background: '#fafafa',
            borderRadius: 8,
            border: '1px solid #eee',
            overflow: 'hidden',
          }}
        >
          {(() => {
            const f = detectDocumentFormat(filename, content);
            if (f === 'plantuml') {
              return (
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <PlantUMLViewer content={content || ''} codeFontFamily={codeFontFamily} />
                </div>
              );
            }
            if (f === 'markdown') {
              return (
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
              );
            }
            // 纯文本：带行号的预览
            return (
              <div style={{ flex: 1, display: 'flex' }}>
                <TextViewer
                  content={content || ''}
                  codeFontFamily={codeFontFamily}
                  lineColRef={lineColRef}
                  contentColRef={contentColRef}
                />
              </div>
            );
          })()}
        </div>
      </div>
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