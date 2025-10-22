import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import '../../styles/MainLayout.css';

export const MainLayout: React.FC = () => {
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { isAuthenticated } = useAuthGuard();

  if (!isAuthenticated) {
    return null;
  }

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
              <button className="close-btn" onClick={() => setShowKnowledge(false)}>
                ×
              </button>
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
              <p style={{ padding: '20px', color: '#5f6368' }}>设置功能开发中...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};