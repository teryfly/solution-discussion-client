import React from 'react';

interface StopButtonProps {
  visible: boolean;
  onStop: () => void;
}

const StopButton: React.FC<StopButtonProps> = ({ visible, onStop }) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
        height: '64px',
      }}
    >
      <button
        style={{
          pointerEvents: 'auto',
          background: '#fff',
          color: '#d32f2f',
          border: '2px solid #d32f2f',
          borderRadius: 32,
          width: 58,
          height: 58,
          fontSize: 32,
          boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          transition: 'background 0.18s',
        }}
        title="停止生成"
        onClick={onStop}
        onMouseEnter={e => {
          (e.target as HTMLElement).style.background = '#ffebee';
        }}
        onMouseLeave={e => {
          (e.target as HTMLElement).style.background = '#fff';
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="16" fill="currentColor" fillOpacity="0.1" />
          <rect x="10" y="10" width="12" height="12" rx="2" fill="#d32f2f" />
        </svg>
      </button>
    </div>
  );
};

export default StopButton;