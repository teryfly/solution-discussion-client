import React from 'react';
import '../../styles/FloatingButton.css';

interface FloatingButtonProps {
  icon: string;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left';
  variant?: 'primary' | 'danger';
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  icon,
  onClick,
  position = 'bottom-right',
  variant = 'primary',
}) => {
  return (
    <button
      className={`floating-button ${position} ${variant}`}
      onClick={onClick}
    >
      {icon}
    </button>
  );
};