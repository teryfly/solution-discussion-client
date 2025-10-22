import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/BottomNav.css';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/chat', label: '对话', icon: '💬' },
    { path: '/projects', label: '项目', icon: '🏗️' },
    { path: '/logs', label: '日志', icon: '📝' },
  ];

  return (
    <div className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          className={`nav-tab ${location.pathname.startsWith(tab.path) ? 'active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};