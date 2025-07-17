// NewConversationPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createConversation, getProjects, getModels } from './api';

interface Project {
  id: number;
  name: string;
}

const DEFAULT_PROMPT = '你是一个项目助手。';

const NewConversationPage: React.FC = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [system, setSystem] = useState(DEFAULT_PROMPT);
  const [projectId, setProjectId] = useState(0);

  useEffect(() => {
    getProjects()
      .then(res => {
        setProjects(res);
      })
      .catch(err => console.error('加载项目失败:', err));

    getModels()
      .then(res => {
        setModels(res);
        if (res.length > 0) setModel(res[0]); // ✅ 设置默认模型
      })
      .catch(err => console.error('加载模型失败:', err));
  }, []);

  const handleCreate = async () => {
    if (!model) {
      alert('模型尚未加载，请稍后重试');
      return;
    }

    const projectName = projects.find(p => p.id === projectId)?.name || '其它';

    const conversationId = await createConversation(system, projectId, name, model);

    // ✅ 携带项目名用于自动定位
    navigate(`/chat/${conversationId}`, {
      state: {
        highlightProject: projectName,
      },
    });
  };

  return (
    <div style={{ padding: 30, maxWidth: 500, margin: '0 auto' }}>
      <h2>新建会话</h2>

      <div style={{ marginBottom: 12 }}>
        <label>会话名（可选）：</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>选择模型：</label>
        <select value={model} onChange={(e) => setModel(e.target.value)} style={{ width: '100%' }}>
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>选择项目：</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(Number(e.target.value))}
          style={{ width: '100%' }}
        >
          <option value={0}>其它</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>System Prompt：</label>
        <textarea
          rows={3}
          value={system}
          onChange={(e) => setSystem(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleCreate}>✅ 创建</button>
        <button onClick={() => navigate(-1)}>取消</button>
      </div>
    </div>
  );
};

export default NewConversationPage;
