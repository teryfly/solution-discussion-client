// src/ContextMenu.tsx
import React, { useEffect, useRef, useState } from 'react';

export interface MenuItem {
  label: string;
  onClick?: () => void;
  submenu?: MenuItem[];
}

interface Props {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

const ContextMenu: React.FC<Props> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [submenuIndex, setSubmenuIndex] = useState<number | null>(null);

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
      style={{
        position: 'fixed',
        top: y,
        left: x,
        background: 'white',
        border: '1px solid #ccc',
        borderRadius: 6,
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        zIndex: 9999,
        minWidth: 160,
        fontSize: 14,
        overflow: 'visible',
      }}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          onMouseEnter={() => setSubmenuIndex(item.submenu ? idx : null)}
          onMouseLeave={() => setSubmenuIndex(null)}
          onClick={() => {
            if (!item.submenu && item.onClick) {
              item.onClick();
              onClose();
            }
          }}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            position: 'relative',
            background: submenuIndex === idx ? '#f5f5f5' : undefined,
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{item.label}</span>
          {item.submenu && <span style={{ fontSize: 12 }}>▶</span>}

          {item.submenu && submenuIndex === idx && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '100%',
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: 6,
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                zIndex: 10000,
                minWidth: 160,
              }}
            >
              {item.submenu.map((sub, subIdx) => (
                <div
                  key={subIdx}
                  onClick={() => {
                    sub.onClick?.();
                    onClose();
                  }}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: subIdx < item.submenu.length - 1 ? '1px solid #eee' : undefined,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {sub.label}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ContextMenu;
