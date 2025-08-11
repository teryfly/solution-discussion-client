// ConversationList.tsx
import React, { useState } from 'react'; 
import { ConversationMeta, Project } from './types';
import ContextMenu, { MenuItem } from './ContextMenu';
import NewConversationModal from './NewConversationModal';
import ProjectManagement from './components/ProjectManagement';
import { useLocation } from 'react-router-dom';
import {
  updateConversationName,
  updateConversationModel,
  deleteConversation,
  deleteProject,
} from './api';
interface Props {
  projects: Project[];
  selectedProjectId: number;
  onProjectSelect: (projectId: number) => void;
  conversations: ConversationMeta[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: (options: { name?: string; model: string; system?: string; project_id: number; project_name?: string }) => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onModelChange: (id: string, newModel: string) => void;
  modelOptions: string[];
  onProjectUpdate?: () => void; // 项目更新后的回调
}
const ConversationList: React.FC<Props> = ({
  projects,
  selectedProjectId,
  onProjectSelect,
  conversations,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
  onModelChange,
  modelOptions,
  onProjectUpdate,
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [projectContextMenu, setProjectContextMenu] = useState<{ x: number; y: number; projectId: number } | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showProjectManagement, setShowProjectManagement] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | undefined>();
  const location = useLocation();
  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, id });
  };
  const handleProjectContextMenu = (e: React.MouseEvent, projectId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectContextMenu({ x: e.clientX, y: e.clientY, projectId });
  };
  const handleProjectEdit = (projectId: number) => {
    setEditingProjectId(projectId);
    setShowProjectManagement(true);
    setProjectContextMenu(null);
  };
  const handleProjectDelete = async (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    // const projectName = project?.name || '未知项目';
    if (window.confirm(`确定要删除项目「${project?.name || '未知项目'}」吗？此操作不可恢复！`)) {
      try {
        await deleteProject(projectId);
        // alert('项目删除成功！');
        onProjectUpdate?.();
      } catch (err) {
        // alert('删除项目失败: ' + (err?.message || err));
      }
    }
    setProjectContextMenu(null);
  };
  const handleNewProject = () => {
    setEditingProjectId(undefined);
    setShowProjectManagement(true);
  };
  const handleProjectManagementSuccess = () => {
    onProjectUpdate?.();
    setShowProjectManagement(false);
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
  const renderProjectContextMenu = () => {
    if (!projectContextMenu) return null;
    return (
      <ContextMenu
        x={projectContextMenu.x}
        y={projectContextMenu.y}
        onClose={() => setProjectContextMenu(null)}
        items={[
          {
            label: '编辑',
            onClick: () => handleProjectEdit(projectContextMenu.projectId),
          },
          {
            label: '删除',
            onClick: () => handleProjectDelete(projectContextMenu.projectId),
          },
        ]}
      />
    );
  };
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const defaultProjectName = selectedProject?.name || '其它';
  // 将"其它"项目移到最后
  const sortedProjects = [...projects].sort((a, b) => {
    if (a.id === 0) return 1; // "其它"排到最后
    if (b.id === 0) return -1;
    return 0; // 保持其他项目的原有顺序
  });
  return (
    <div className="conversation-list" style={{ display: 'flex' }}>
      {/* 左列：项目列表（来自 /v1/projects） */}
      <div style={{ width: '120px', borderRight: '1px solid #ccc' }}>
        <button
          onClick={handleNewProject}
          style={{ 
            marginBottom: 12, 
            width: '100%',
            fontSize: '12px',
            padding: '6px 8px'
          }}
        >
          新建项目
        </button>
        {sortedProjects.map(project => (
          <div
            key={project.id}
            onClick={() => onProjectSelect(project.id)}
            onContextMenu={(e) => project.id !== 0 ? handleProjectContextMenu(e, project.id) : undefined}
            style={{
              padding: '8px 10px',
              cursor: 'pointer',
              background: selectedProjectId === project.id ? '#d0e4ff' : undefined,
              position: 'relative',
            }}
          >
            {project.name}
          </div>
        ))}
      </div>
      {/* 右列：当前项目下的会话（status==0） */}
      <div style={{ flex: 1, paddingLeft: 10 }}>
        <button
          onClick={() => setShowNewModal(true)}
          style={{ 
            marginBottom: 12, 
            width: '100%',
            fontSize: '14px',
            padding: '8px 12px'
          }}
        >
          新建会话
        </button>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {conversations.map((conv) => (
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
      {renderProjectContextMenu()}
      <NewConversationModal
        visible={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreate={(options) => {
          onNew(options);
        }}
        modelOptions={modelOptions}
        defaultProjectName={defaultProjectName}
      />
      <ProjectManagement
        visible={showProjectManagement}
        onClose={() => setShowProjectManagement(false)}
        projectId={editingProjectId}
        onSuccess={handleProjectManagementSuccess}
      />
    </div>
  );
};
export default ConversationList;