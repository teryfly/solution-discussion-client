import React from 'react';

export const SideHeader: React.FC<{
  title: string;
  subtitle: string;
  onClose: () => void;
}> = ({ title, subtitle, onClose }) => (
  <div style={{ padding: '24px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 24, color: '#333' }}>{title}</h2>
        <div style={{ fontSize: 16, color: '#666', marginTop: 8 }}>{subtitle}</div>
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          fontSize: 24,
          cursor: 'pointer',
          color: '#999',
          padding: 0,
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="关闭"
      >
        ×
      </button>
    </div>
  </div>
);

export const TabsBar: React.FC<{
  tabs: Array<{ key: number | 'all'; label: string; count: number }>;
  active: number | 'all';
  onChange: (key: number | 'all') => void;
  onAdd: () => void;
  onSelectAll?: () => void;
  showSelectAll?: boolean;
  // new controls
  latestOnly: boolean;
  onLatestOnlyChange: (v: boolean) => void;
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  selectedCount: number;
}> = ({
  tabs, active, onChange, onAdd, onSelectAll, showSelectAll,
  latestOnly, onLatestOnlyChange, searchQuery, onSearchQueryChange, selectedCount
}) => (
  <div style={{ padding: '12px 20px', borderBottom: '1px solid #eee', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
    {tabs.map(tab => (
      <button
        key={String(tab.key)}
        onClick={() => onChange(tab.key)}
        style={{
          padding: '6px 10px',
          border: active === tab.key ? '2px solid #1a73e8' : '1px solid #ddd',
          background: active === tab.key ? '#e8f0fe' : '#fff',
          borderRadius: 999,
          color: '#333',
          fontSize: 13,
          cursor: 'pointer',
        }}
        title={`${tab.label} (${tab.count})`}
      >
        {tab.label} ({tab.count})
      </button>
    ))}

    {/* Spacer */}
    <div style={{ flex: 1 }} />

    {/* Selected count */}
    <div style={{ fontSize: 12, color: '#666' }}>
      已选: {selectedCount}
    </div>

    {/* Latest-only checkbox */}
    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={latestOnly}
        onChange={(e) => onLatestOnlyChange(e.target.checked)}
        style={{ margin: 0, cursor: 'pointer' }}
        />
      仅显示最新版本
    </label>

    {/* Search input */}
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => onSearchQueryChange(e.target.value)}
      placeholder="模糊搜索(文件名/内容)"
      style={{
        padding: '6px 8px',
        border: '1px solid #ddd',
        borderRadius: 6,
        fontSize: 12,
        minWidth: 180,
      }}
    />

    {showSelectAll && (
      <button
        onClick={onSelectAll}
        style={{
          padding: '6px 12px',
          background: 'none',
          border: '1px solid #1a73e8',
          color: '#1a73e8',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 12,
        }}
      >
        本页全选/不选
      </button>
    )}

    <button
      onClick={onAdd}
      style={{
        padding: '6px 12px',
        background: '#4caf50',
        color: '#fff',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 12,
      }}
      title="新增文档"
    >
      + 新增文档
    </button>
  </div>
);