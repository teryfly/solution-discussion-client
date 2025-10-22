import React from 'react';
import '../../styles/Badge.css';

interface BadgeProps {
  text: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'default';
  size?: 'small' | 'medium';
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'default',
  size = 'medium',
}) => {
  return (
    <span className={`badge badge-${variant} badge-${size}`}>
      {text}
    </span>
  );
};