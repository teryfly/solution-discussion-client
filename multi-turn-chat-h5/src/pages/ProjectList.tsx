import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '../api/project';
import { useGlobalStore } from '../stores/globalStore';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import type { Project } from '../types';
import '../styles/ProjectList.css';

export const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { currentProject, setCurrentProject } = useGlobalStore();
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectApi.getProjects();
      setProjects(data);
    } catch (error: any) {
      showToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((proj) =>
    proj.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProjectClick = (project: Project) => {
    setCurrentProject(project);
    showToast({ message: `已切换到项目: ${project.name}`, type: 'success' });
  };

  const handleNewProject = () => {
    navigate('/projects/new');
  };

  const handleEditProject = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    navigate(`/projects/${project.id}/edit`);
  };

  const handleDeleteProject = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    
    const confirmed = await showConfirm({
      title: '删除项目',
      message: `确定要删除项目"${project.name}"吗？此操作不可撤销。`,
      type: 'danger',
    });

    if (confirmed) {
      try {
        await projectApi.deleteProject(project.id);
        showToast({ message: '项目已删除', type: 'success' });
        loadProjects();
        if (currentProject?.id === project.id) {
          setCurrentProject(null);
        }
      } catch (error: any) {
        showToast({ message: error.message, type: 'error' });
      }
    }
  };

  return (
    <div className="project-list-page">
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 搜索项目..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner spinner-medium"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">暂无项目</div>
          <div className="empty-description">
            {searchQuery ? '未找到匹配的项目' : '点击右下角按钮创建第一个项目'}
          </div>
        </div>
      ) : (
        <div className="project-list">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className={`project-card ${currentProject?.id === project.id ? 'active' : ''}`}
              onClick={() => handleProjectClick(project)}
            >
              <div className="project-header">
                <span className="project-icon">🏗️</span>
                <span className="project-name">{project.name}</span>
              </div>
              <div className="project-info">
                <div className="project-env">
                  开发环境: {project.dev_environment || 'Development'}
                </div>
                <div className="project-dir">
                  AI目录: {project.ai_work_dir || '未配置'}
                </div>
              </div>
              <div className="project-status">
                <span className={`status-indicator ${project.ai_work_dir ? 'configured' : 'unconfigured'}`}>
                  {project.ai_work_dir ? '● 已配置' : '○ 需要配置'}
                </span>
              </div>
              <div className="project-actions">
                <button
                  className="project-action-btn"
                  onClick={(e) => handleEditProject(e, project)}
                >
                  编辑
                </button>
                <button
                  className="project-action-btn danger"
                  onClick={(e) => handleDeleteProject(e, project)}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="fab" onClick={handleNewProject}>
        +
      </button>
    </div>
  );
};