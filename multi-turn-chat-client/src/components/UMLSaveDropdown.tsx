import React, { useState, useRef, useEffect } from 'react';
import usePlanCategories from '../hooks/usePlanCategories';
import { createPlanDocument } from '../api';
import { extractPlantUMLTitle } from '../utils/plantUMLUtils';

// 下拉箭头图标
const DropdownIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6,9 12,15 18,9" />
  </svg>
);

// 保存图标
const SaveIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17,21 17,13 7,13 7,21" />
    <polyline points="7,3 7,8 15,8" />
  </svg>
);

interface UMLSaveDropdownProps {
  umlCode: string;
  projectId?: number;
  disabled?: boolean;
}

const UMLSaveDropdown: React.FC<UMLSaveDropdownProps> = ({ 
  umlCode, 
  projectId, 
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { categories } = usePlanCategories();

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 处理保存到指定分类
  const handleSaveToCategory = async (categoryId: number, categoryName: string) => {
    if (!projectId || saving) return;

    setIsOpen(false);
    setSaving(true);

    try {
      // 从UML代码中提取title作为文件名
      const title = extractPlantUMLTitle(umlCode);
      const filename = title.endsWith('.puml') ? title : `${title}.puml`;

      await createPlanDocument({
        project_id: projectId,
        filename,
        category_id: categoryId,
        content: umlCode,
        version: 1,
        source: 'chat',
      });

      setSaveSuccess(categoryName);
      setTimeout(() => setSaveSuccess(null), 2000);
    } catch (error: any) {
      console.error('保存UML文档失败:', error);
      alert(`保存到《${categoryName}》失败: ${error?.message || '未知错误'}`);
    } finally {
      setSaving(false);
    }
  };

  // 如果没有项目ID或分类，不显示组件
  if (!projectId || !categories || categories.length === 0) {
    return null;
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => !disabled && !saving && setIsOpen(!isOpen)}
        disabled={disabled || saving}
        style={{
          background: saveSuccess ? '#4caf50' : '#f5f5f5',
          border: `1px solid ${saveSuccess ? '#4caf50' : '#ddd'}`,
          padding: '6px 8px',
          cursor: (disabled || saving) ? 'not-allowed' : 'pointer',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: saveSuccess ? '#fff' : '#666',
          fontSize: '12px',
          opacity: (disabled || saving) ? 0.6 : 1,
          transition: 'all 0.2s ease',
          minWidth: '80px',
          justifyContent: 'space-between'
        }}
        title="UML另存为"
        onMouseEnter={(e) => {
          if (!saveSuccess && !disabled && !saving) {
            (e.target as HTMLElement).style.background = '#e8f0fe';
            (e.target as HTMLElement).style.borderColor = '#1a73e8';
            (e.target as HTMLElement).style.color = '#1a73e8';
          }
        }}
        onMouseLeave={(e) => {
          if (!saveSuccess && !disabled && !saving) {
            (e.target as HTMLElement).style.background = '#f5f5f5';
            (e.target as HTMLElement).style.borderColor = '#ddd';
            (e.target as HTMLElement).style.color = '#666';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <SaveIcon />
          <span>
            {saving ? '保存中...' : saveSuccess ? `已保存到${saveSuccess}` : '另存为'}
          </span>
        </div>
        {!saving && !saveSuccess && <DropdownIcon />}
      </button>

      {isOpen && !disabled && !saving && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '160px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}
        >
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => handleSaveToCategory(category.id, category.name)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                borderBottom: '1px solid #f0f0f0',
                transition: 'background 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = '#fff';
              }}
            >
              {category.name}
            </div>
          ))}
          
          {categories.length === 0 && (
            <div
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                color: '#999',
                fontStyle: 'italic'
              }}
            >
              暂无可用分类
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UMLSaveDropdown;