// ConversationList.tsx
import React, { useState, useEffect } from 'react'; 
import { ConversationMeta } from './types';
import ContextMenu, { MenuItem } from './ContextMenu';
import NewConversationModal from './NewConversationModal';
import { useLocation } from 'react-router-dom';
import {
  updateConversationName,
  updateConversationModel,
  deleteConversation,
} from './api';

interface Props {
  conversations: ConversationMeta[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: (options: { name?: string; model: string; system?: string; project_id: number; project_name?: string }) => void;
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
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('其它');

  const location = useLocation();
  useEffect(() => {
    const state = location.state as any;
    if (state?.highlightProject) {
      setSelectedProject(state.highlightProject);
    }
  }, [location.state]);

  const grouped = conversations.reduce((acc, conv) => {
    const key = conv.projectName || '其它';
    if (!acc[key]) acc[key] = [];
    acc[key].push(conv);
    return acc;
  }, {} as Record<string, ConversationMeta[]>);

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, id });
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
            onClick: async () => {
              const name = prompt('请输入新名称', current?.name || '');
              if (name && name !== current?.name) {
                await updateConversationName(id, name);
                onRename(id, name);
              }
            },
          },
          {
            label: '切换模型',
            submenu: modelOptions.map((model) => ({
              label: model,
              onClick: async () => {
                if (model !== current?.model) {
                  await updateConversationModel(id, model);
                  onModelChange(id, model);
                }
              },
            })),
          },
          {
            label: '删除会话',
            onClick: async () => {
              const name = current?.name || '未命名';
              if (window.confirm(`确定要删除会话「${name}」吗？`)) {
                await deleteConversation(id);
                onDelete(id);
              }
            },
          },
        ]}
      />
    );
  };

  // ⬇⬇⬇ 关键：传递 defaultProjectName 到新建弹窗
  return (
    <div className="conversation-list" style={{ display: 'flex' }}>
      {/* 左列：项目列表 */}
      <div style={{ width: '120px', borderRight: '1px solid #ccc' }}>
        {Object.keys(grouped).map(project => (
          <div
            key={project}
            onClick={() => setSelectedProject(project)}
            style={{
              padding: '8px 10px',
              cursor: 'pointer',
              background: selectedProject === project ? '#d0e4ff' : undefined,
            }}
          >
            {project}
          </div>
        ))}
        <button
          onClick={() => setShowNewModal(true)}
          style={{ marginTop: 12 }}
        >
          ➕ 新建
        </button>
      </div>

      {/* 右列：该项目下会话 */}
      <div style={{ flex: 1, paddingLeft: 10 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {grouped[selectedProject]?.map((conv) => (
            <li
              key={conv.id}
              className={conv.id === activeId ? 'active' : ''}
              onClick={() => onSelect(conv.id)}
              onContextMenu={(e) => handleContextMenu(e, conv.id)}
              style={{
                padding: '8px',
                borderRadius: 6,
                marginBottom: 8,
                backgroundColor: conv.id === activeId ? '#e6f0ff' : '#f6f6f6',
                border: '1px solid #ccc',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 500 }}>{conv.name || '未命名会话'}</div>
              <div style={{ fontSize: 12, color: '#444' }}>
                {conv.assistanceRole || '（无角色）'}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>{conv.model}</div>
            </li>
          ))}
        </ul>
      </div>

      {renderContextMenu()}

      <NewConversationModal
        visible={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreate={(options) => {
          onNew(options);
          setSelectedProject(options.project_name || '其它');
        }}
        modelOptions={modelOptions}
        defaultProjectName={selectedProject}   // 👈 新增传递
      />
    </div>
  );
};

export default ConversationList;