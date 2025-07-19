// NewConversationPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createConversation, getProjects, getModels } from './api';
import { ROLE_PROMPTS } from './config';

interface Project {
  id: number;
  name: string;
}

function generateDefaultName(role: string) {
  const now = new Date();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${role}${MM}${DD}${hh}${mm}`;
}

const NewConversationPage: React.FC = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState('');
  const [projectId, setProjectId] = useState(0);
  const [role, setRole] = useState('需求分析师');
  const [name, setName] = useState(generateDefaultName('需求分析师'));
  const [system, setSystem] = useState(ROLE_PROMPTS['需求分析师']);

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch((err) => console.error('加载项目失败:', err));

    getModels()
      .then((res) => {
        setModels(res);
        if (res.length > 0) setModel(res[0]);
      })
      .catch((err) => console.error('加载模型失败:', err));
  }, []);

  const handleRoleChange = (r: string) => {
    setRole(r);
    setName(generateDefaultName(r));
    if (r === '通用助手') {
      setSystem('');
    } else {
      setSystem(ROLE_PROMPTS[r]);
    }
  };

  const handleCreate = async () => {
    if (!model) {
      alert('模型尚未加载，请稍后重试');
      return;
    }
    const projectName = projects.find((p) => p.id === projectId)?.name || '其它';
    const conversationId = await createConversation(system, projectId, name, model);

    navigate(`/chat/${conversationId}`, {
      state: {
        highlightProject: projectName,
      },
    });
  };

  return (
  <div className="new-conversation-page">
    <div>
      <h2 style={{ textAlign: 'center', marginBottom: 30 }}>新建会话</h2>

      {/* 第一行：角色 + 会话名 */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <label>助手角色：</label>
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value)}
            style={{ width: '100%' }}
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
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* 第二行：项目 + 模型 */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <label>相关项目：</label>
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
        <div style={{ flex: 1 }}>
          <label>选择模型：</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            style={{ width: '100%' }}
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 第三行：仅通用助手时显示 prompt 输入框 */}
      {role === '通用助手' && (
        <div style={{ marginBottom: 20 }}>
          <label>System Prompt：</label>
          <textarea
            rows={4}
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      )}

      {/* 操作按钮 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
        <button onClick={handleCreate}>✅ 创建</button>
        <button onClick={() => navigate(-1)}>取消</button>
      </div>
    </div>
  </div>
  
  );
};

export default NewConversationPage;
