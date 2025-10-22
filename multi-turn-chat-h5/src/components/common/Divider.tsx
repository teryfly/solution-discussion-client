import React from 'react';
import '../../styles/Divider.css';

interface DividerProps {
  text?: string;
  margin?: 'small' | 'medium' | 'large';
}

export const Divider: React.FC<DividerProps> = ({
  text,
  margin = 'medium',
}) => {
  return (
    <div className={`divider divider-${margin}`}>
      {text ? (
        <>
          <span className="divider-line"></span>
          <span className="divider-text">{text}</span>
          <span className="divider-line"></span>
        </>
      ) : (
        <span className="divider-line full"></span>
      )}
    </div>
  );
};