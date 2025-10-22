import React from 'react';
import '../../styles/ProgressBar.css';

interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'error';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = false,
  variant = 'primary',
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="progress-bar-container">
      <div className="progress-bar">
        <div
          className={`progress-fill progress-${variant}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showLabel && (
        <span className="progress-label">{clampedProgress}%</span>
      )}
    </div>
  );
};