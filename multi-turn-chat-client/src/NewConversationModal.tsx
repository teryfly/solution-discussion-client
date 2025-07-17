// NewConversationModal.tsx
import React, { useEffect, useState } from 'react';
import { getProjects } from './api';

function getDefaultName() {
  const now = new Date();
  return now.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).replace(/\//g, '-');
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
  const [name, setName] = useState(getDefaultName());
  const [model, setModel] = useState('');
  const [system, setSystem] = useState('');
  const [projectId, setProjectId] = useState(0);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    if (visible) {
      setName(getDefaultName());
      setModel(modelOptions[0] || ''); // ✅ 设置默认模型
      getProjects().then(setProjects);
    }
  }, [visible, modelOptions]);

  if (!visible) return null;

  const handleCreate = () => {
    const projectName = projects.find(p => p.id === projectId)?.name || '其它';
    onCreate({ name, model, system, project_id: projectId, project_name: projectName }); // ✅ 加 project_name
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>新建会话</h3>

        <label>会话名（可选）：</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />

        <label>模型：</label>
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          {modelOptions.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <label>System Prompt（可选）：</label>
        <textarea
          rows={3}
          value={system}
          onChange={(e) => setSystem(e.target.value)}
        />

        <label>项目：</label>
        <select value={projectId} onChange={(e) => setProjectId(Number(e.target.value))}>
          <option value={0}>其它</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <div className="modal-actions">
          <button onClick={handleCreate}>创建</button>
          <button onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal;
