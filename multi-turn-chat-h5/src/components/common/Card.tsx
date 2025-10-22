import React from 'react';
import '../../styles/Card.css';

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  onClick,
  active = false,
  className = '',
}) => {
  return (
    <div
      className={`card ${active ? 'card-active' : ''} ${onClick ? 'card-clickable' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};