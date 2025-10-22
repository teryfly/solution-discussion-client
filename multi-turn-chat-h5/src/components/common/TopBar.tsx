import React from 'react';
import { useGlobalStore } from '../../stores/globalStore';
import '../../styles/TopBar.css';

interface TopBarProps {
  onKnowledgeClick?: () => void;
  onSettingsClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onKnowledgeClick,
  onSettingsClick,
}) => {
  const { currentProject } = useGlobalStore();

  return (
    <div className="top-bar">
      <div className="top-bar-project">
        {currentProject ? currentProject.name : '未选择项目'}
      </div>
      <div className="top-bar-actions">
        {onKnowledgeClick && (
          <button className="top-bar-btn" onClick={onKnowledgeClick}>
            📄
          </button>
        )}
        {onSettingsClick && (
          <button className="top-bar-btn" onClick={onSettingsClick}>
            ⚙
          </button>
        )}
      </div>
    </div>
  );
};