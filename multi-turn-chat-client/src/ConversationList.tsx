// ✅ 文件：ConversationList.tsx（集成右键菜单 + 新建会话弹窗 + 下拉菜单 + 样式优化）
import React, { useState } from 'react';
import { ConversationMeta } from './types';
import ContextMenu, { MenuItem } from './ContextMenu';
import NewConversationModal from './NewConversationModal';

interface Props {
  conversations: ConversationMeta[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: (options: { name?: string; model: string; system?: string }) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onModelChange: (id: string, newModel: string) => void;
  modelOptions: string[];
}

const ConversationList: React.FC<Props> = ({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  onModelChange,
  modelOptions,
}) => {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    id: string;
  } | null>(null);

  const [showNewModal, setShowNewModal] = useState(false);

  const handleContextMenu = (
    e: React.MouseEvent,
    id: string
  ) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, id });
  };

  const confirmDelete = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    const name = conv?.name || '未命名';
    if (window.confirm(`确定要删除会话「${name}」（ID: ${id}）吗？`)) {
      onDelete(id);
    }
  };

  const renderContextMenu = () => {
    if (!contextMenu) return null;
    const id = contextMenu.id;
    const current = conversations.find(c => c.id === id);
    return (
      <ContextMenu
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu(null)}
        items={[
          {
            label: '重命名',
            onClick: () => {
              const name = prompt('请输入新名称', current?.name || '');
              if (name) onRename(id, name);
            },
          },
          ...modelOptions.map((model) => ({
            label: `切换为模型：${model}`,
            onClick: () => onModelChange(id, model),
          })),
          {
            label: '删除会话',
            onClick: () => confirmDelete(id),
          },
        ]}
      />
    );
  };

  return (
    <div className="conversation-list">
      <h3 style={{ marginBottom: 10 }}>会话列表</h3>
      <ul style={{ paddingLeft: 0, marginBottom: 20 }}>
        {conversations.map((conv) => (
          <li
            key={conv.id}
            className={conv.id === activeId ? 'active' : ''}
            onClick={() => onSelect(conv.id)}
            onContextMenu={(e) => handleContextMenu(e, conv.id)}
            style={{
              listStyle: 'none',
              padding: '8px 10px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              marginBottom: '8px',
              backgroundColor: conv.id === activeId ? '#e6f0ff' : '#f9f9f9',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ fontWeight: 500 }}>{conv.name || '未命名会话'}</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              ID: {conv.id}<br />
              模型: {conv.model}
            </div>
          </li>
        ))}
      </ul>

      <button
        onClick={() => setShowNewModal(true)}
        style={{ width: '100%', padding: '10px 0', borderRadius: 6, background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        ➕ 新建会话
      </button>

      {renderContextMenu()}

      <NewConversationModal
        visible={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreate={onNew}
        modelOptions={modelOptions}
      />
    </div>
  );
};

export default ConversationList;