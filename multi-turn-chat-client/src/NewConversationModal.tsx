import React, { useEffect, useState } from 'react';
import { getProjects, getCompleteSourceCode } from './api';
import { ROLE_CONFIGS } from './config';
// 默认生成会话名（格式 MMDDhhmmss）
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
const NewConversationModal: React.FC<Props> = ({
  visible,
  onClose,
  onCreate,
  modelOptions,
  defaultProjectName
}) => {
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [role, setRole] = useState('软件架构师'); // 默认角色
  const [name, setName] = useState(generateDefaultName());
  const [system, setSystem] = useState(ROLE_CONFIGS['软件架构师'].prompt);
  const [model, setModel] = useState(ROLE_CONFIGS['软件架构师'].model);
  const [projectId, setProjectId] = useState(0);
  const [modelList, setModelList] = useState<string[]>([]);
  const [learnSourceCode, setLearnSourceCode] = useState(false); // ✅ 是否学习项目源码
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
      setRole('软件架构师'); // 默认
      setName(generateDefaultName());
      setSystem(ROLE_CONFIGS['软件架构师'].prompt);
      setLearnSourceCode(false);
      getProjects().then((_projects) => {
        setProjects(_projects);
        let defaultId = 0;
        if (defaultProjectName && defaultProjectName !== '其它') {
          const found = _projects.find((p) => p.name === defaultProjectName);
          if (found) defaultId = found.id;
        }
        setProjectId(defaultId);
      });
      const { list, value } = getModelsAndSelect('软件架构师', modelOptions);
      setModelList(list);
      setModel(value);
    }
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
    // 自动勾选“学习项目源码”
    if (r === '敏捷开发工程师') {
      setLearnSourceCode(true);
    } else {
      setLearnSourceCode(false);
    }
  };
  const handleCreate = async () => {
    let finalSystem = system;
    const projectName = projects.find((p) => p.id === projectId)?.name || '其它';
    if (learnSourceCode && projectId > 0) {
      try {
        const completeSource = await getCompleteSourceCode(projectId);
        finalSystem += `\n\n--- The File Structure and Source Code of this Project BEGIN---\n${completeSource}\n--- Source Code END ---`;
      } catch (e) {
        alert('加载项目源码失败: ' + ((e as any)?.message || e));
        return;
      }
    }
    onCreate({
      name,
      model,
      system: finalSystem,
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
            <select value={role} onChange={(e) => handleRoleChange(e.target.value)}>
              {Object.keys(ROLE_CONFIGS).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>会话名：</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label>相关项目：</label>
            <select value={projectId} onChange={(e) => setProjectId(Number(e.target.value))}>
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
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              {modelList.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        <br />
        <div>
          <label className="inline-label">
            <input
              type="checkbox"
              checked={learnSourceCode}
              onChange={(e) => setLearnSourceCode(e.target.checked)}
            />
            学习项目源码(需确保项目工作路径设置正确，会增加token消耗)
          </label>
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