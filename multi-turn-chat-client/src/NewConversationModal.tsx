// NewConversationModal.tsx
import React, { useEffect, useState } from 'react';
import { getProjects } from './api';
import { ROLE_CONFIGS } from './config';

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
    role?: string;
  }) => void;
  modelOptions: string[];
}

const NewConversationModal: React.FC<Props> = ({ visible, onClose, onCreate, modelOptions }) => {
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [role, setRole] = useState('需求分析师');
  const [name, setName] = useState(generateDefaultName('需求分析师'));
  const [system, setSystem] = useState(ROLE_CONFIGS['需求分析师'].prompt);
  const [model, setModel] = useState(ROLE_CONFIGS['需求分析师'].model);
  const [projectId, setProjectId] = useState(0);
  const [modelList, setModelList] = useState<string[]>([]);

  // 工具函数：根据角色和 modelOptions 计算最终下拉列表和选中项
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

  // 初始化
  useEffect(() => {
    if (visible) {
      setRole('需求分析师');
      setName(generateDefaultName('需求分析师'));
      setSystem(ROLE_CONFIGS['需求分析师'].prompt);
      setProjectId(0);
      getProjects().then(setProjects);

      // modelOptions 由父组件传入，需根据默认角色处理
      const { list, value } = getModelsAndSelect('需求分析师', modelOptions);
      setModelList(list);
      setModel(value);
    }
    // eslint-disable-next-line
  }, [visible, modelOptions]);

  // 切换角色时处理模型下拉
  const handleRoleChange = (r: string) => {
    setRole(r);
    setName(generateDefaultName(r));
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