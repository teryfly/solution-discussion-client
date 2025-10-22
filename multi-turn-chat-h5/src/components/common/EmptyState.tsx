import React from 'react';
import '../../styles/EmptyState.css';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      <div className="empty-description">{description}</div>
      {action && (
        <button className="empty-action-btn" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
};