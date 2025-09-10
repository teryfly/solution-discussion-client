import React from 'react';
import { DocumentHeaderProps } from './types';

const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  editMode,
  filename,
  saving,
  loading,
  currentDocumentId,
  documentDetail,
  originalDocumentId,
  onFilenameChange,
  onEditModeToggle,
  onSave,
  onCancel,
  onClose,
}) => {
  const codeFontFamily = "'Consolas','Monaco','Courier New','Liberation Mono','DejaVu Sans Mono',monospace";

  return (
    <div
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #eee',
        background: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexShrink: 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0, fontFamily: codeFontFamily, fontWeight: 600, fontSize: 16 }}>
        {editMode ? (
          <input
            type="text"
            value={filename}
            onChange={(e) => onFilenameChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              border: '2px solid #e0e0e0',
              borderRadius: 8,
              fontSize: 16,
              fontFamily: codeFontFamily,
              boxSizing: 'border-box',
            }}
            placeholder="请输入文件名"
          />
        ) : (
          <div
            style={{
              color: '#333',
              lineHeight: 1.25,
              wordBreak: 'break-word',
            }}
            title={filename}
          >
            {filename}
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap', fontFamily: codeFontFamily }}>
          ID: {currentDocumentId} | 版本: {documentDetail?.version || 'N/A'}
          {currentDocumentId !== originalDocumentId && (
            <span style={{ color: '#4caf50', marginLeft: 6 }}>(已更新为新版本)</span>
          )}
        </div>
        
        {editMode ? (
          <>
            <button
              onClick={onCancel}
              disabled={saving}
              style={{
                padding: '6px 10px',
                background: '#f5f5f5',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: 6,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 13,
              }}
            >
              取消
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              style={{
                padding: '6px 10px',
                background: saving ? '#ccc' : '#1a73e8',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 13,
              }}
            >
              {saving ? '保存中...' : '保存 (Ctrl+Enter)'}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onEditModeToggle}
              disabled={loading}
              style={{
                padding: '6px 10px',
                background: '#1a73e8',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              编辑
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '6px 10px',
                background: '#666',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              关闭
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentHeader;