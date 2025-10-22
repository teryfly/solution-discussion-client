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
    { id: 'general', label: '通用', icon: '💬' },
    { id: 'product', label: '产品', icon: '📋' },
    { id: 'architect', label: '架构', icon: '🏗️' },
    { id: 'ba', label: 'BA', icon: '📊' },
  ];

  const handleSubmit = () => {
    onCreate({
      model: selectedModel,
      role: selectedRole,
      name: name || undefined,
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
                  onClick={() => setSelectedRole(role.id)}
                >
                  <span className="role-icon">{role.icon}</span>
                  <span className="role-label">{role.label}</span>
                </button>
              ))}
            </div>
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