import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { createProject, updateProject, getProjectDetail, getModels } from '../api';
interface ProjectManagementProps {
  visible: boolean;
  onClose: () => void;
  projectId?: number; // 如果传入则为编辑模式，否则为新建模式
  onSuccess?: (project: Project) => void;
}
const DEFAULT_GRPC = '192.168.120.238:50051';
const ProjectManagement: React.FC<ProjectManagementProps> = ({
  visible,
  onClose,
  projectId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    dev_environment: '',
    grpc_server_address: DEFAULT_GRPC,
    llm_model: 'GPT-4.1',
    llm_url: 'http://43.132.224.225:8000/v1/chat/completions',
    git_work_dir: '/git_workspace',
    ai_work_dir: '/aiWorkDir',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [modelOptions, setModelOptions] = useState<string[]>(['GPT-4.1']);
  const isEditMode = typeof projectId === 'number';
  // 加载模型下拉框数据
  useEffect(() => {
    getModels().then(setModelOptions).catch(() => {});
  }, []);
  // 加载项目详情（编辑模式）
  useEffect(() => {
    if (visible && isEditMode && projectId) {
      setLoading(true);
      getProjectDetail(projectId)
        .then((project) => {
          setFormData({
            name: project.name || '',
            dev_environment: project.dev_environment || '',
            grpc_server_address: project.grpc_server_address || DEFAULT_GRPC,
            llm_model: project.llm_model || modelOptions[0] || '',
            llm_url: project.llm_url || 'http://43.132.224.225:8000/v1/chat/completions',
            git_work_dir: project.git_work_dir || '/git_workspace',
            ai_work_dir: project.ai_work_dir || '/aiWorkDir',
          });
        })
        .catch(() => {
          onClose();
        })
        .finally(() => setLoading(false));
    } else if (visible && !isEditMode) {
      // 新建模式，重置表单
      setFormData({
        name: '',
        dev_environment: '',
        grpc_server_address: DEFAULT_GRPC,
        llm_model: modelOptions[0] || 'GPT-4.1',
        llm_url: 'http://43.132.224.225:8000/v1/chat/completions',
        git_work_dir: '/git_workspace',
        ai_work_dir: '/aiWorkDir',
      });
    }
    setErrors({});
    // eslint-disable-next-line
  }, [visible, isEditMode, projectId, modelOptions]);
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = '项目名称不能为空';
    }
    if (!formData.dev_environment.trim()) {
      newErrors.dev_environment = '开发环境不能为空';
    }
    if (!formData.grpc_server_address.trim()) {
      newErrors.grpc_server_address = 'gRPC服务地址不能为空';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      let result: Project;
      if (isEditMode && projectId) {
        result = await updateProject(projectId, formData);
      } else {
        result = await createProject(formData);
      }
      onSuccess?.(result);
      onClose();
    } catch (err) {
      // 无alert
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };
  // 键盘快捷键支持
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [visible, formData, loading]);
  if (!visible) return null;
  return (
    <div className="project-management-page">
      <div>
        <h2 style={{ textAlign: 'center', marginBottom: 30 }}>
          {isEditMode ? '编辑项目' : '新建项目'}
        </h2>
        <div className="form-section">
          <label>项目名称 *</label>
          <input
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="请输入项目名称"
            disabled={loading}
          />
          {errors.name && <div className="error-text">{errors.name}</div>}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label>开发环境 *</label>
            <input
              value={formData.dev_environment}
              onChange={(e) => handleInputChange('dev_environment', e.target.value)}
              placeholder="例如: python3.11"
              disabled={loading}
            />
            {errors.dev_environment && <div className="error-text">{errors.dev_environment}</div>}
          </div>
          <div style={{ flex: 1 }}>
            <label>gRPC服务地址 *</label>
            <input
              value={formData.grpc_server_address}
              onChange={(e) => handleInputChange('grpc_server_address', e.target.value)}
              placeholder={DEFAULT_GRPC}
              disabled={loading}
            />
            {errors.grpc_server_address && <div className="error-text">{errors.grpc_server_address}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label>LLM模型</label>
            <select
              value={formData.llm_model}
              onChange={e => handleInputChange('llm_model', e.target.value)}
              disabled={loading}
            >
              {modelOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>LLM服务URL</label>
            <input
              value={formData.llm_url}
              onChange={(e) => handleInputChange('llm_url', e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label>Git工作目录</label>
            <input
              value={formData.git_work_dir}
              onChange={(e) => handleInputChange('git_work_dir', e.target.value)}
              disabled={loading}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>AI工作目录</label>
            <input
              value={formData.ai_work_dir}
              onChange={(e) => handleInputChange('ai_work_dir', e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <div className="modal-actions">
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? (isEditMode ? '更新中...' : '创建中...') : (isEditMode ? '更新项目' : '创建项目')}
          </button>
          <button onClick={onClose} disabled={loading}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
export default ProjectManagement;