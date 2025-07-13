// src/ContextMenu.tsx
import React, { useEffect, useRef } from 'react';

export interface MenuItem {
  label: string;
  onClick: () => void;
}

interface Props {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

const ContextMenu: React.FC<Props> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed', // 🔧 use fixed for viewport-accurate positioning
        top: y,
        left: x,
        background: 'white',
        border: '1px solid #ccc',
        borderRadius: 6,
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        zIndex: 9999,
        minWidth: '140px',
        fontSize: '14px',
      }}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          className="context-menu-item"
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            borderBottom: idx < items.length - 1 ? '1px solid #eee' : undefined,
          }}
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
};

export default ContextMenu;
