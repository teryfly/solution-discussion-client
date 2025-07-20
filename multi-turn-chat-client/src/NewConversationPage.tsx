// NewConversationPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createConversation, getProjects, getModels } from './api';
import { ROLE_CONFIGS } from './config';

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
  const [modelList, setModelList] = useState<string[]>([]);
  const [projectId, setProjectId] = useState(0);
  const [role, setRole] = useState('需求分析师');
  const [name, setName] = useState(generateDefaultName('需求分析师'));
  const [system, setSystem] = useState(ROLE_CONFIGS['需求分析师'].prompt);

  // 工具函数：根据角色和模型选项返回最终下拉列表和选中项
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
    getProjects()
      .then(setProjects)
      .catch((err) => console.error('加载项目失败:', err));

    getModels()
      .then((res) => {
        setModels(res);
        const { list, value } = getModelsAndSelect('需求分析师', res);
        setModelList(list);
        setModel(value);
      })
      .catch((err) => console.error('加载模型失败:', err));
    // eslint-disable-next-line
  }, []);

  const handleRoleChange = (r: string) => {
    setRole(r);
    setName(generateDefaultName(r));
    if (r === '通用助手') {
      setSystem('');
    } else {
      setSystem(ROLE_CONFIGS[r]?.prompt || '');
    }
    const { list, value } = getModelsAndSelect(r, models);
    setModelList(list);
    setModel(value);
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
        role,
      },
    });
  };

  return (
    <div className="new-conversation-page">
      <div>
        <h2 style={{ textAlign: 'center', marginBottom: 30 }}>新建会话</h2>
        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label>助手角色：</label>
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
              style={{ width: '100%' }}
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
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
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
              onChange={e => setModel(e.target.value)}
              style={{ width: '100%' }}
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
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
          <button onClick={handleCreate}>✅ 创建</button>
          <button onClick={() => navigate(-1)}>取消</button>
        </div>
      </div>
    </div>
  );
};

export default NewConversationPage;