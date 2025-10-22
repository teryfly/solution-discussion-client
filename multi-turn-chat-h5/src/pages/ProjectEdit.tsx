import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectApi } from '../api/project';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import type { Project } from '../types';
import '../styles/ProjectEdit.css';

export const ProjectEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dev_environment: 'Development',
    grpc_server_address: '',
    llm_model: 'GPT-4.1',
    llm_url: 'http://43.132.224.225:8000/v1/chat/completions',
    git_work_dir: '/git_workspace',
    ai_work_dir: '/aiWorkDir',
  });

  const isEdit = id && id !== 'new';

  useEffect(() => {
    if (isEdit) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const project = await projectApi.getProject(Number(id));
      setFormData({
        name: project.name,
        dev_environment: project.dev_environment || 'Development',
        grpc_server_address: project.grpc_server_address || '',
        llm_model: project.llm_model || 'GPT-4.1',
        llm_url: project.llm_url || 'http://43.132.224.225:8000/v1/chat/completions',
        git_work_dir: project.git_work_dir || '/git_workspace',
        ai_work_dir: project.ai_work_dir || '/aiWorkDir',
      });
    } catch (error: any) {
      showToast({ message: error.message, type: 'error' });
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.name.length < 2) {
      showToast({ message: '项目名称至少2个字符', type: 'error' });
      return;
    }

    if (!formData.dev_environment) {
      showToast({ message: '请选择开发环境', type: 'error' });
      return;
    }

    if (!formData.grpc_server_address) {
      showToast({ message: '请输入 gRPC 服务器地址', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      if (isEdit) {
        await projectApi.updateProject(Number(id), formData);
        showToast({ message: '项目已更新', type: 'success' });
      } else {
        await projectApi.createProject(formData);
        showToast({ message: '项目已创建', type: 'success' });
      }
      navigate('/projects');
    } catch (error: any) {
      showToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm({
      title: '删除项目',
      message: `确定要删除项目"${formData.name}"吗？此操作不可撤销。`,
      type: 'danger',
    });

    if (confirmed) {
      try {
        await projectApi.deleteProject(Number(id));
        showToast({ message: '项目已删除', type: 'success' });
        navigate('/projects');
      } catch (error: any) {
        showToast({ message: error.message, type: 'error' });
      }
    }
  };

  return (
    <div className="project-edit-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/projects')}>
          ←
        </button>
        <h2>{isEdit ? '编辑项目' : '新建项目'}</h2>
        <div style={{ width: 32 }}></div>
      </div>

      <form onSubmit={handleSubmit} className="project-form">
        <div className="form-section">
          <label className="form-label">项目名称 *</label>
          <input
            type="text"
            className="form-input"
            placeholder="输入项目名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={loading}
          />
        </div>

        <div className="form-section">
          <label className="form-label">开发环境 *</label>
          <select
            className="form-select"
            value={formData.dev_environment}
            onChange={(e) => setFormData({ ...formData, dev_environment: e.target.value })}
            disabled={loading}
          >
            <option value="REACT+TypeScript+Vite">REACT+TypeScript+Vite</option>
            <option value="VUE+TypeScript+Vite">VUE+TypeScript+Vite</option>
            <option value=".NET CORE+EF">.NET CORE+EF</option>
            <option value="Python+FastAPI">Python+FastAPI</option>
            <option value="JAVA+SpringBoot">JAVA+SpringBoot</option>
          </select>
        </div>

        <div className="form-section">
          <label className="form-label">gRPC 服务器地址 *</label>
          <input
            type="text"
            className="form-input"
            placeholder="例如: localhost:50051"
            value={formData.grpc_server_address}
            onChange={(e) => setFormData({ ...formData, grpc_server_address: e.target.value })}
            disabled={loading}
          />
          <div className="form-hint">💡 用于与后端服务通信的 gRPC 地址</div>
        </div>

        <div className="form-section">
          <label className="form-label">LLM 模型</label>
          <input
            type="text"
            className="form-input"
            placeholder="GPT-4.1"
            value={formData.llm_model}
            onChange={(e) => setFormData({ ...formData, llm_model: e.target.value })}
            disabled={loading}
          />
        </div>

        <div className="form-section">
          <label className="form-label">LLM URL</label>
          <input
            type="text"
            className="form-input"
            placeholder="http://43.132.224.225:8000/v1/chat/completions"
            value={formData.llm_url}
            onChange={(e) => setFormData({ ...formData, llm_url: e.target.value })}
            disabled={loading}
          />
        </div>

        <div className="form-section">
          <label className="form-label">Git 工作目录</label>
          <input
            type="text"
            className="form-input"
            placeholder="/git_workspace"
            value={formData.git_work_dir}
            onChange={(e) => setFormData({ ...formData, git_work_dir: e.target.value })}
            disabled={loading}
          />
        </div>

        <div className="form-section">
          <label className="form-label">AI 工作目录</label>
          <input
            type="text"
            className="form-input"
            placeholder="/aiWorkDir"
            value={formData.ai_work_dir}
            onChange={(e) => setFormData({ ...formData, ai_work_dir: e.target.value })}
            disabled={loading}
          />
          <div className="form-hint">💡 AI生成的代码将保存到此目录</div>
        </div>

        <div className="form-actions">
          {isEdit && (
            <button
              type="button"
              className="btn-delete"
              onClick={handleDelete}
              disabled={loading}
            >
              删除项目
            </button>
          )}
          <div style={{ flex: 1 }}></div>
          <button
            type="button"
            className="btn-cancel"
            onClick={() => navigate('/projects')}
            disabled={loading}
          >
            取消
          </button>
          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
};