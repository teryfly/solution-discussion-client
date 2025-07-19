// NewConversationModal.tsx
import React, { useEffect, useState } from 'react';
import { getProjects } from './api';
import { ROLE_PROMPTS } from './config';

function generateDefaultName(role: string) {
  const now = new Date();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${role}${MM}${DD}${hh}${mm}`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (options: {
    name?: string;
    model: string;
    system?: string;
    project_id: number;
    project_name?: string;
  }) => void;
  modelOptions: string[];
}

const NewConversationModal: React.FC<Props> = ({ visible, onClose, onCreate, modelOptions }) => {
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [model, setModel] = useState('');
  const [projectId, setProjectId] = useState(0);
  const [role, setRole] = useState('需求分析师');
  const [name, setName] = useState(generateDefaultName('需求分析师'));
  const [system, setSystem] = useState(ROLE_PROMPTS['需求分析师']);

  useEffect(() => {
    if (visible) {
      setRole('需求分析师');
      setName(generateDefaultName('需求分析师'));
      setSystem(ROLE_PROMPTS['需求分析师']);
      setModel(modelOptions[0] || '');
      getProjects().then(setProjects);
    }
  }, [visible, modelOptions]);

  const handleRoleChange = (r: string) => {
    setRole(r);
    setName(generateDefaultName(r));
    if (r !== '通用助手') {
      setSystem(ROLE_PROMPTS[r]);
    } else {
      setSystem('');
    }
  };

  const handleCreate = () => {
    const projectName = projects.find((p) => p.id === projectId)?.name || '其它';
    onCreate({
      name,
      model,
      system,
      project_id: projectId,
      project_name: projectName,
    });
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="new-conversation-page">
      <div>
        <h2 style={{ textAlign: 'center', marginBottom: 30 }}>新建会话</h2>

        {/* 第一行：角色 + 会话名 */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label>助手角色：</label>
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
            >
              {Object.keys(ROLE_PROMPTS).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>会话名：</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        {/* 第二行：项目 + 模型 */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label>相关项目：</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(Number(e.target.value))}
            >
              <option value={0}>其它</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>选择模型：</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {modelOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 第三行：仅通用助手时显示 system prompt */}
        {role === '通用助手' && (
          <div>
            <label>System Prompt：</label>
            <textarea
              rows={3}
              value={system}
              onChange={(e) => setSystem(e.target.value)}
            />
          </div>
        )}

        {/* 操作按钮 */}
        <div className="modal-actions">
          <button onClick={handleCreate}>创建</button>
          <button onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal;
