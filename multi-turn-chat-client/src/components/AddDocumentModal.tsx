import React, { useState, useEffect } from 'react';
import { createPlanDocument } from '../api';
import usePlanCategories from '../hooks/usePlanCategories';

interface AddDocumentModalProps {
  visible: boolean;
  projectId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
  visible,
  projectId,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    filename: '',
    content: '',
    category_id: 5, // 默认知识库分类ID
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { categories } = usePlanCategories();

  // 重置表单
  const resetForm = () => {
    setFormData({
      filename: '',
      content: '',
      category_id: 5,
    });
    setErrors({});
  };

  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.filename.trim()) {
      newErrors.filename = '文件名不能为空';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = '内容不能为空';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存文档
  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      await createPlanDocument({
        project_id: projectId,
        filename: formData.filename.trim(),
        category_id: formData.category_id,
        content: formData.content,
        version: 1,
        source: 'user',
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('创建文档失败:', error);
      setErrors({ submit: (error as any)?.message || '创建文档失败' });
    } finally {
      setSaving(false);
    }
  };

  // 处理输入变化
  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 键盘快捷键支持
  useEffect(() => {
    if (!visible) return;
    
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
    };
    
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [visible, formData, saving]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 10001, // 比DocumentReferenceModal的zIndex高
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          width: '90%',
          maxWidth: 800,
          maxHeight: '80%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* 头部 */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20, color: '#333' }}>
            新增文档
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#999',
              padding: 0,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="关闭"
          >
            ×
          </button>
        </div>

        {/* 内容区域 */}
        <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          {errors.submit && (
            <div style={{
              color: '#f44336',
              background: '#ffebee',
              padding: '12px 16px',
              borderRadius: 6,
              marginBottom: 20,
              fontSize: 14,
            }}>
              {errors.submit}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 文件名 */}
            <div>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>
                文件名 *
              </label>
              <input
                type="text"
                value={formData.filename}
                onChange={(e) => handleInputChange('filename', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.filename ? '#f44336' : '#ccc'}`,
                  borderRadius: 6,
                  fontSize: 15,
                  boxSizing: 'border-box',
                }}
                placeholder="请输入文件名，如：项目需求文档.md"
                disabled={saving}
              />
              {errors.filename && (
                <div style={{ color: '#f44336', fontSize: 12, marginTop: 4 }}>
                  {errors.filename}
                </div>
              )}
            </div>

            {/* 分类 */}
            <div>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>
                分类
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => handleInputChange('category_id', Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ccc',
                  borderRadius: 6,
                  fontSize: 15,
                  boxSizing: 'border-box',
                }}
                disabled={saving}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 内容 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>
                内容 *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                style={{
                  flex: 1,
                  minHeight: 300,
                  padding: '12px',
                  border: `1px solid ${errors.content ? '#f44336' : '#ccc'}`,
                  borderRadius: 6,
                  fontSize: 14,
                  fontFamily: 'monospace',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
                placeholder="请输入文档内容，支持Markdown格式"
                disabled={saving}
              />
              {errors.content && (
                <div style={{ color: '#f44336', fontSize: 12, marginTop: 4 }}>
                  {errors.content}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '8px 16px',
              background: '#f5f5f5',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: 6,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '8px 16px',
              background: saving ? '#ccc' : '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? '保存中...' : '保存 (Ctrl+Enter)'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDocumentModal;