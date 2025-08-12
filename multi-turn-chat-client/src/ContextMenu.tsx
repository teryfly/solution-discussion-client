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
  const submenuRef = useRef<HTMLDivElement>(null);
  const [submenuIndex, setSubmenuIndex] = useState<number | null>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x, y });
  const [submenuPos, setSubmenuPos] = useState({ x: 0, y: 0 });
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          (!submenuRef.current || !submenuRef.current.contains(e.target as Node))) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  // 清理定时器
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    };
  }, []);
  // 计算主菜单显示位置，防止超出视口
  useEffect(() => {
    if (!menuRef.current) return;
    const menuWidth = 180; // 估算菜单宽度
    const menuHeight = items.length * 36 + 16; // 估算每项高度36px，加上内边距
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let newX = x;
    let newY = y;
    // 水平位置调整
    if (x + menuWidth > viewportWidth) {
      newX = Math.max(8, viewportWidth - menuWidth - 8);
    }
    // 垂直位置调整
    if (y + menuHeight > viewportHeight) {
      newY = Math.max(8, viewportHeight - menuHeight - 8);
    }
    setAdjustedPos({ x: newX, y: newY });
  }, [x, y, items.length]);
  // 计算子菜单位置
  const calculateSubmenuPosition = (itemIndex: number, submenuItems: MenuItem[]) => {
    if (!menuRef.current) return { x: 0, y: 0 };
    const menuRect = menuRef.current.getBoundingClientRect();
    const itemHeight = 36;
    const submenuWidth = 180;
    const submenuHeight = submenuItems.length * 36 + 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    // 默认在右侧显示
    let submenuX = menuRect.right;
    let submenuY = menuRect.top + itemIndex * itemHeight;
    // 如果右侧空间不够，显示在左侧
    if (submenuX + submenuWidth > viewportWidth) {
      submenuX = menuRect.left - submenuWidth;
    }
    // 如果左侧也不够，强制显示在视口内
    if (submenuX < 0) {
      submenuX = Math.min(viewportWidth - submenuWidth - 8, menuRect.right);
    }
    // 垂直位置调整
    if (submenuY + submenuHeight > viewportHeight) {
      submenuY = Math.max(8, viewportHeight - submenuHeight - 8);
    }
    return { x: submenuX, y: submenuY };
  };
  // 显示子菜单
  const showSubmenu = (index: number, item: MenuItem) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    if (item.submenu) {
      setSubmenuIndex(index);
      const pos = calculateSubmenuPosition(index, item.submenu);
      setSubmenuPos(pos);
    }
  };
  // 隐藏子菜单（带延迟）
  const hideSubmenu = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      setSubmenuIndex(null);
    }, 300); // 300ms延迟，给用户足够时间移动到子菜单
  };
  // 取消隐藏子菜单
  const cancelHideSubmenu = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };
  const handleMainMenuMouseEnter = (index: number, item: MenuItem) => {
    if (item.submenu) {
      showSubmenu(index, item);
    } else {
      hideSubmenu();
    }
  };
  const handleMainMenuMouseLeave = () => {
    hideSubmenu();
  };
  const handleSubmenuMouseEnter = () => {
    cancelHideSubmenu();
  };
  const handleSubmenuMouseLeave = () => {
    hideSubmenu();
  };
  return (
    <>
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          top: adjustedPos.y,
          left: adjustedPos.x,
          background: 'white',
          border: '1px solid #ccc',
          borderRadius: 6,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          zIndex: 9999,
          minWidth: 160,
          fontSize: 14,
          overflow: 'visible',
        }}
        onMouseLeave={handleMainMenuMouseLeave}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            onMouseEnter={() => handleMainMenuMouseEnter(idx, item)}
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
              borderBottom: idx < items.length - 1 ? '1px solid #eee' : undefined,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{item.label}</span>
            {item.submenu && <span style={{ fontSize: 12 }}>▶</span>}
          </div>
        ))}
      </div>
      {/* 子菜单使用固定定位，独立于主菜单 */}
      {submenuIndex !== null && items[submenuIndex]?.submenu && (
        <div
          ref={submenuRef}
          style={{
            position: 'fixed',
            top: submenuPos.y,
            left: submenuPos.x,
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: 6,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            zIndex: 10000,
            minWidth: 160,
            fontSize: 14,
          }}
          onMouseEnter={handleSubmenuMouseEnter}
          onMouseLeave={handleSubmenuMouseLeave}
        >
          {items[submenuIndex].submenu!.map((sub, subIdx) => (
            <div
              key={subIdx}
              onClick={() => {
                sub.onClick?.();
                onClose();
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: subIdx < items[submenuIndex].submenu!.length - 1 ? '1px solid #eee' : undefined,
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = '';
              }}
            >
              {sub.label}
            </div>
          ))}
        </div>
      )}
    </>
  );
};
export default ContextMenu;