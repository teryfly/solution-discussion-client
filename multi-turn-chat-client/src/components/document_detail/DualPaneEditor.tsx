import React, { useRef, useState, useEffect } from 'react';
import { detectDocumentFormat } from './formatDetection';
import PlantUMLViewer from './PlantUMLViewer';
import MarkdownViewer from './MarkdownViewer';
import TextViewer from './TextViewer';

interface DualPaneEditorProps {
  content: string;
  filename: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showPreview?: boolean; // 是否显示预览面板
  initialLeftRatio?: number; // 初始左侧比例
}

const DualPaneEditor: React.FC<DualPaneEditorProps> = ({
  content,
  filename,
  onContentChange,
  placeholder = "请输入文档内容，支持Markdown与PlantUML(@startuml ... @enduml)",
  disabled = false,
  showPreview = true,
  initialLeftRatio = 0.4,
}) => {
  const codeFontFamily = "'Consolas','Monaco','Courier New','Liberation Mono','DejaVu Sans Mono',monospace";
  const [leftRatio, setLeftRatio] = useState(initialLeftRatio);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineColRef = useRef<HTMLDivElement>(null);
  const contentColRef = useRef<HTMLDivElement>(null);
  
  const dragState = useRef<{ dragging: boolean; startX: number; startRatio: number }>({
    dragging: false,
    startX: 0,
    startRatio: initialLeftRatio,
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

  // 处理内容变化，防止自动滚动
  const handleContentChange = (e: React.FormEvent<HTMLTextAreaElement>) => {
    // 保存当前滚动位置
    const scrollTop = e.currentTarget.scrollTop;
    const scrollLeft = e.currentTarget.scrollLeft;
    
    // 处理内容变化
    onContentChange(e.currentTarget.value);
    
    // 在下一帧恢复滚动位置
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.scrollTop = scrollTop;
        textareaRef.current.scrollLeft = scrollLeft;
      }
    });
  };

  // 如果不显示预览，只显示编辑器
  if (!showPreview) {
    return (
      <div style={{ flex: 1, display: 'flex', padding: 12, boxSizing: 'border-box' }}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          onInput={handleContentChange}
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
            scrollBehavior: 'auto',
            overflowX: 'auto',
            overflowY: 'auto',
          }}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
    );
  }

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
      {/* 左侧：编辑器 */}
      <div style={{ width: `${leftRatio * 100}%`, minWidth: 100, display: 'flex' }}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          onInput={handleContentChange}
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
            scrollBehavior: 'auto',
            overflowX: 'auto',
            overflowY: 'auto',
          }}
          placeholder={placeholder}
          disabled={disabled}
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

      {/* 右侧：预览 */}
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
          if (format === 'plantuml') {
            return (
              <div style={{ flex: 1, overflow: 'auto' }}>
                <PlantUMLViewer content={content || ''} codeFontFamily={codeFontFamily} />
              </div>
            );
          }
          if (format === 'markdown') {
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
};

export default DualPaneEditor;