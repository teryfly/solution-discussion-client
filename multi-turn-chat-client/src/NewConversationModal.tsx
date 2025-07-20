// NewConversationModal.tsx
import React, { useEffect, useState } from 'react';
import { getProjects } from './api';
import { ROLE_CONFIGS } from './config';

// 修改这里，返回 MMDDhhmmss 格式
function generateDefaultName() {
  const now = new Date();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${MM}${DD}${hh}${mm}${ss}`;
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
    role?: string;
  }) => void;
  modelOptions: string[];
  defaultProjectName?: string;
}

const NewConversationModal: React.FC<Props> = ({ visible, onClose, onCreate, modelOptions, defaultProjectName }) => {
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [role, setRole] = useState('需求分析师');
  const [name, setName] = useState(generateDefaultName());
  const [system, setSystem] = useState(ROLE_CONFIGS['需求分析师'].prompt);
  const [model, setModel] = useState(ROLE_CONFIGS['需求分析师'].model);
  const [projectId, setProjectId] = useState(0);
  const [modelList, setModelList] = useState<string[]>([]);

  function getModelsAndSelect(role: string, modelOptions: string[]) {
    const defaultModel = ROLE_CONFIGS[role]?.model || '';
    let list = [...modelOptions];
    let value = defaultModel || (modelOptions[0] || '');
    if (defaultModel && !modelOptions.includes(defaultModel)) {
      list = [defaultModel, ...modelOptions];
      value = defaultModel;
    }
    return { list, value };
  }

  useEffect(() => {
    if (visible) {
      setRole('需求分析师');
      setName(generateDefaultName());
      setSystem(ROLE_CONFIGS['需求分析师'].prompt);
      getProjects().then(_projects => {
        setProjects(_projects);

        let defaultId = 0;
        if (defaultProjectName && defaultProjectName !== '其它') {
          const found = _projects.find(p => p.name === defaultProjectName);
          if (found) defaultId = found.id;
        }
        setProjectId(defaultId);
      });

      const { list, value } = getModelsAndSelect('需求分析师', modelOptions);
      setModelList(list);
      setModel(value);
    }
    // eslint-disable-next-line
  }, [visible, modelOptions, defaultProjectName]);

  const handleRoleChange = (r: string) => {
    setRole(r);
    setName(generateDefaultName());
    if (r !== '通用助手') {
      setSystem(ROLE_CONFIGS[r]?.prompt || '');
    } else {
      setSystem('');
    }
    const { list, value } = getModelsAndSelect(r, modelOptions);
    setModelList(list);
    setModel(value);
  };

  const handleCreate = () => {
    const projectName = projects.find((p) => p.id === projectId)?.name || '其它';
    onCreate({
      name,
      model,
      system,
      project_id: projectId,
      project_name: projectName,
      role,
    });
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="new-conversation-page">
      <div>
        <h2 style={{ textAlign: 'center', marginBottom: 30 }}>新建会话</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label>助手角色：</label>
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
            >
              {Object.keys(ROLE_CONFIGS).map((r) => (
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
              onChange={e => setModel(e.target.value)}
            >
              {modelList.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
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
        <div className="modal-actions">
          <button onClick={handleCreate}>创建</button>
          <button onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal;