import React from 'react';

export const ModalHeader: React.FC<{ title: string; onClose: () => void; disabled?: boolean }> = ({
  title,
  onClose,
  disabled,
}) => (
  <div
    style={{
      padding: '20px 24px',
      borderBottom: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexShrink: 0,
      background: '#f8f9fa',
    }}
  >
    <h2 style={{ margin: 0, fontSize: 24, color: '#333' }}>{title}</h2>
    <button
      onClick={onClose}
      disabled={disabled}
      style={{
        background: 'none',
        border: 'none',
        fontSize: 32,
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: '#999',
        padding: 0,
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title="关闭"
    >
      ×
    </button>
  </div>
);