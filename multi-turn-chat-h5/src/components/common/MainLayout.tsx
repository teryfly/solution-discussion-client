import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { useGlobalStore } from '../../stores/globalStore';
import { useConfirm } from '../../hooks/useConfirm';
import '../../styles/MainLayout.css';

export const MainLayout: React.FC = () => {
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, theme, fontSize, setTheme, setFontSize, logout, isAuthenticated } = useGlobalStore();
  const { showConfirm } = useConfirm();

  const authed = isAuthenticated();

  useEffect(() => {
    if (!authed) {
      navigate('/login', { replace: true });
    }
  }, [authed, navigate, location.pathname]);

  if (!authed) return null;

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      title: '退出登录',
      message: '确定要退出登录吗？',
      confirmText: '退出',
      type: 'default',
    });
    if (confirmed) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="main-layout">
      <TopBar
        onKnowledgeClick={() => setShowKnowledge(true)}
        onSettingsClick={() => setShowSettings(true)}
      />

      <div className="main-content">
        <Outlet />
      </div>

      <BottomNav />

      {showKnowledge && (
        <div className="overlay" onClick={() => setShowKnowledge(false)}>
          <div className="sidebar knowledge-sidebar" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-header">
              <h3>知识库引用</h3>
              <button className="close-btn" onClick={() => setShowKnowledge(false)}>×</button>
            </div>
            <div className="sidebar-content">
              <p style={{ padding: '20px', color: '#5f6368' }}>知识库功能开发中...</p>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="overlay" onClick={() => setShowSettings(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-header">
              <div className="bottom-sheet-handle"></div>
              <h3>设置</h3>
            </div>
            <div className="bottom-sheet-content">
              <div className="settings-section">
                <div className="settings-section-title">用户信息</div>
                <div className="settings-item">
                  <div className="settings-item-label">姓名</div>
                  <div className="settings-item-value">{user?.name || '未设置'}</div>
                </div>
                <div className="settings-item">
                  <div className="settings-item-label">用户名</div>
                  <div className="settings-item-value">{user?.username || '未知'}</div>
                </div>
              </div>

              <div className="settings-section">
                <div className="settings-section-title">主题设置</div>
                <div className="settings-item">
                  <div className="settings-item-label">外观</div>
                  <select
                    className="settings-select"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
                  >
                    <option value="light">浅色</option>
                    <option value="dark">深色</option>
                  </select>
                </div>
                <div className="settings-item">
                  <div className="settings-item-label">字体大小</div>
                  <select
                    className="settings-select"
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value as 'small' | 'medium' | 'large')}
                  >
                    <option value="small">小</option>
                    <option value="medium">中</option>
                    <option value="large">大</option>
                  </select>
                </div>
              </div>

              <div className="settings-section">
                <button className="settings-logout-btn" onClick={handleLogout}>
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};