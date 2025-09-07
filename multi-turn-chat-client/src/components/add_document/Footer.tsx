import React from 'react';

export const ModalFooter: React.FC<{
  onCancel: () => void;
  onSave: () => void;
  disabled?: boolean;
  saving?: boolean;
}> = ({ onCancel, onSave, disabled, saving }) => (
  <div
    style={{
      padding: '20px 24px',
      borderTop: '1px solid #eee',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 16,
      flexShrink: 0,
      background: '#f8f9fa',
    }}
  >
    <button
      onClick={onCancel}
      disabled={disabled}
      style={{
        padding: '12px 24px',
        background: '#f5f5f5',
        color: '#666',
        border: '2px solid #ddd',
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 16,
        fontWeight: 500,
      }}
    >
      取消
    </button>
    <button
      onClick={onSave}
      disabled={disabled}
      style={{
        padding: '12px 24px',
        background: disabled ? '#ccc' : '#1a73e8',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 16,
        fontWeight: 500,
      }}
    >
      {saving ? '保存中...' : '保存 (Ctrl+Enter)'}
    </button>
  </div>
);