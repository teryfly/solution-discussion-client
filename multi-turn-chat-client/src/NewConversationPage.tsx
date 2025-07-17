// NewConversationPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createConversation, getProjects, getModels } from './api';

interface Project {
  id: number;
  name: string;
}

const DEFAULT_PROMPT = '你是一个系统分析师，擅长帮助用户的优化关于软件设计方案的prompt。用户将输入一个软件设计需求/思路的 prompt, 请分析 prompt 的中的描述，判断需求是否明确、思路是否清晰、设计是否合理。如果有不明确、不清楚或不合理的地方就要求用户在下一轮对话中进一步解释、明确或更正。如果你有更好的建议或意见也请提出来让用户确认是否采纳。如果没有问题或建议，则输出优化后的完整版本的提示词（only prompt，nothing else), 以“设计一个XXX软件程序，从整体项目的结构，到每一个细节，输出一个开发设计文档，程序员将根据你输出的文档进行编码，这个文档是他编码工作的唯一信息来源。1、开发语言与环境 ...  2、功能要求...” 开头。';

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
