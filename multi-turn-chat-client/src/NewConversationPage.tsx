// src/NewConversationPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createConversation } from './api';

interface Project {
  id: number;
  name: string;
}

const DEFAULT_PROMPT = '你是一个项目助手。';

const NewConversationPage: React.FC = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [model, setModel] = useState('gpt-4');
  const [system, setSystem] = useState(DEFAULT_PROMPT);
  const [projectId, setProjectId] = useState(0);

  useEffect(() => {
    fetch('http://localhost:8000/v1/projects')
      .then((res) => res.json())
      .then(setProjects)
      .catch((err) => console.error('加载项目失败:', err));
  }, []);

  const handleCreate = async () => {
    const conversationId = await createConversation(system, projectId);
    // 跳回主页面并传递新 ID（你可用 navigate state 或 URL param）
    navigate(`/chat/${conversationId}`);
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
          <option value="gpt-4">gpt-4</option>
          <option value="gpt-3.5">gpt-3.5</option>
          {/* 可动态加载模型 */}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>选择项目：</label>
        <select value={projectId} onChange={(e) => setProjectId(Number(e.target.value))} style={{ width: '100%' }}>
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
