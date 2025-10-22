import React from 'react';
import '../../styles/Loading.css';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  overlay?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'medium',
  text,
  overlay = false,
}) => {
  const content = (
    <div className={`loading-container ${overlay ? 'loading-overlay' : ''}`}>
      <div className={`spinner spinner-${size}`}></div>
      {text && <div className="loading-text">{text}</div>}
    </div>
  );

  return content;
};