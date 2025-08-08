import React from 'react';

const CopyIcon: React.FC<{ animating: boolean }> = ({ animating }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 20 20"
    style={{
      transition: 'transform 0.15s cubic-bezier(.7,-0.5,.6,1.6)',
      transform: animating ? 'scale(1.25) rotate(-15deg)' : 'none',
      fill: animating ? '#4caf50' : '#888',
      verticalAlign: 'middle'
    }}
  >
    <rect x="7" y="7" width="9" height="9" rx="2" fill="currentColor" />
    <rect x="4" y="4" width="9" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const ExpandIcon: React.FC<{ collapsed: boolean }> = ({ collapsed }) =>
  collapsed ? (
    <svg width="17" height="17" viewBox="0 0 20 20" style={{ fill: '#888', verticalAlign: 'middle' }}>
      <path d="M7 8l3 3 3-3" stroke="#888" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 20 20" style={{ fill: '#888', verticalAlign: 'middle', transform: 'rotate(180deg)' }}>
      <path d="M7 8l3 3 3-3" stroke="#888" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );

const BubbleActions: React.FC<{
  collapsed: boolean;
  onToggle: () => void;
  onCopy: () => void;
  copyAnim: boolean;
  role: 'user' | 'assistant';
  isVisible: boolean;
  mouseY: number;
  showExpandIcon: boolean;
}> = ({ collapsed, onToggle, onCopy, copyAnim, role, isVisible, mouseY, showExpandIcon }) => {
  if (!isVisible) return null;

  const isUser = role === 'user';
  
  return (
    <div
      style={{
        position: 'absolute',
        top: `${mouseY}px`,
        transform: 'translateY(-50%)',
        [isUser ? 'left' : 'right']: '-40px',
        display: 'flex',
        flexDirection: 'column',
        gap: 0, // 改为0间距
        zIndex: 10,
        userSelect: 'none',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}
      className="bubble-actions"
    >
      {showExpandIcon && (
        <span
          title={collapsed ? '展开' : '折叠'}
          style={{
            cursor: 'pointer',
            background: '#fff',
            borderRadius: '4px 4px 0 0', // 上边圆角
            padding: '4px',
            transition: 'all 0.18s',
            border: '1px solid #ddd',
            borderBottom: showExpandIcon ? 'none' : '1px solid #ddd', // 如果有下一个图标则去掉下边框
            fontSize: 13,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={e => {
            e.stopPropagation();
            onToggle();
          }}
          onMouseEnter={e => {
            (e.target as HTMLElement).style.background = '#f5f5f5';
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.background = '#fff';
          }}
        >
          <ExpandIcon collapsed={collapsed} />
        </span>
      )}
      <span
        title="复制"
        style={{
          cursor: 'pointer',
          background: '#fff',
          borderRadius: showExpandIcon ? '0 0 4px 4px' : '4px', // 如果是唯一图标则四角圆角，否则只有下边圆角
          padding: '4px',
          transition: 'all 0.18s',
          border: '1px solid #ddd',
          fontSize: 13,
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={e => {
          e.stopPropagation();
          onCopy();
        }}
        onMouseEnter={e => {
          (e.target as HTMLElement).style.background = '#f5f5f5';
        }}
        onMouseLeave={e => {
          (e.target as HTMLElement).style.background = '#fff';
        }}
      >
        <CopyIcon animating={copyAnim} />
      </span>
    </div>
  );
};

export default BubbleActions;