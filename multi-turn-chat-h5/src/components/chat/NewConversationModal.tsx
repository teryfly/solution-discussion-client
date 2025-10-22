import React, { useState, useEffect } from 'react';
import { projectApi } from '../../api/project';
import { useGlobalStore } from '../../stores/globalStore';
import type { Model } from '../../types';
import '../../styles/NewConversationModal.css';

interface NewConversationModalProps {
  onClose: () => void;
  onCreate: (data: {
    model: string;
    role: string;
    name?: string;
    systemPrompt?: string;
  }) => void;
}

export const NewConversationModal: React.FC<NewConversationModalProps> = ({
  onClose,
  onCreate,
}) => {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState('GPT-4');
  const [selectedRole, setSelectedRole] = useState('general');
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const { currentProject } = useGlobalStore();

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const data = await projectApi.getModels();
      setModels(data.data || []);
      if (data.data && data.data.length > 0) {
        setSelectedModel(data.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const roles = [
    { id: 'general', label: '通用', icon: '💬', prompt: 'You are a helpful AI assistant.' },
    { id: 'product', label: '产品', icon: '📋', prompt: 'You are a product manager assistant specialized in requirements analysis and product design.' },
    { id: 'architect', label: '架构', icon: '🏗️', prompt: 'You are a software architect assistant specialized in system design and technical architecture.' },
    { id: 'ba', label: 'BA', icon: '📊', prompt: 'You are a business analyst assistant specialized in business requirements and data analysis.' },
  ];

  const handleRoleChange = (roleId: string) => {
    setSelectedRole(roleId);
    const role = roles.find(r => r.id === roleId);
    if (role && !systemPrompt) {
      setSystemPrompt(role.prompt);
    }
  };

  const handleSubmit = () => {
    const role = roles.find(r => r.id === selectedRole);
    onCreate({
      model: selectedModel,
      role: selectedRole,
      name: name || undefined,
      systemPrompt: systemPrompt || role?.prompt || 'You are a helpful AI assistant.',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content new-conversation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>新建会话</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-section">
            <label className="form-label">会话名称（可选）</label>
            <input
              type="text"
              className="form-input"
              placeholder="输入会话名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-section">
            <label className="form-label">选择模型</label>
            <select
              className="form-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.id}
                </option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <label className="form-label">选择角色</label>
            <div className="role-grid">
              {roles.map((role) => (
                <button
                  key={role.id}
                  className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
                  onClick={() => handleRoleChange(role.id)}
                >
                  <span className="role-icon">{role.icon}</span>
                  <span className="role-label">{role.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-section">
            <label className="form-label">系统提示词（可选）</label>
            <textarea
              className="form-textarea"
              placeholder="自定义系统提示词..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={3}
            />
            <div className="form-hint">💡 留空将使用角色默认提示词</div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            创建会话
          </button>
        </div>
      </div>
    </div>
  );
};