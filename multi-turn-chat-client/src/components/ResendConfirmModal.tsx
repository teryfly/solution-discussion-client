import React, { useEffect } from 'react';
interface ResendConfirmModalProps {
  visible: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
const ResendConfirmModal: React.FC<ResendConfirmModalProps> = ({
  visible,
  loading,
  onConfirm,
  onCancel,
}) => {
  // 键盘快捷键支持
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
    // eslint-disable-next-line
  }, [visible, loading, onConfirm, onCancel]);
  if (!visible) return null;
  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 20000,
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div style={{
        background: '#fff',
        borderRadius: 10,
        padding: 32,
        minWidth: 320,
        boxShadow: '0 4px 16px rgba(0,0,0,0.18)'
      }}>
        <div style={{ fontSize: 18, marginBottom: 18, color: '#d32f2f' }}>
          ⚠️ 该操作将删除该消息后的所有消息并重新流式发送该消息内容，是否继续？
        </div>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 16 }}>
          <button
            style={{ background: '#1a73e8', color: '#fff', padding: '8px 28px', fontSize: 16, borderRadius: 8 }}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? '重发中...' : '继续'}
          </button>
          <button
            style={{ background: '#ccc', color: '#222', padding: '8px 28px', fontSize: 16, borderRadius: 8 }}
            onClick={onCancel}
            disabled={loading}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
export default ResendConfirmModal;