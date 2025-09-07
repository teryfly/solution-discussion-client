import React, { useState, useEffect, useRef } from 'react';
import { createPlanDocument, getMessages } from '../api';
import usePlanCategories from '../hooks/usePlanCategories';
import { ROLE_CONFIGS, BASE_URL, API_KEY } from '../config';

interface AddDocumentModalProps {
  visible: boolean;
  projectId: number;
  onClose: () => void;
  onSuccess?: () => void;
  conversationId?: string;
  defaultCategoryId?: number;
}

const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
  visible,
  projectId,
  onClose,
  onSuccess,
  conversationId,
  defaultCategoryId,
}) => {
  const [formData, setFormData] = useState({
    filename: '',
    content: '',
    category_id: 0, // 默认为0，表示"请选择"
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState<string>('');
  const { categories } = usePlanCategories();
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 重置表单
  const resetForm = () => {
    // 默认分类逻辑：
    // 1. 如果有defaultCategoryId且大于0，使用它
    // 2. 否则默认为0（"请选择"）
    const categoryId = (typeof defaultCategoryId === 'number' && defaultCategoryId > 0) 
      ? defaultCategoryId 
      : 0;
    
    setFormData({
      filename: '',
      content: '',
      category_id: categoryId,
    });
    setErrors({});
    setGenerating(false);
    setGeneratingType('');
  };

  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible, defaultCategoryId]);

  // 自动滚动到底部
  const scrollToBottom = () => {
    if (contentTextareaRef.current) {
      contentTextareaRef.current.scrollTop = contentTextareaRef.current.scrollHeight;
    }
  };

  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.filename.trim()) {
      newErrors.filename = '文件名不能为空';
    }
    if (!formData.content.trim()) {
      newErrors.content = '内容不能为空';
    }
    if (formData.category_id === 0) {
      newErrors.category_id = '请选择分类';
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

  // 处理内容变化并自动滚动
  const handleContentChange = (value: string) => {
    handleInputChange('content', value);
    // 延迟滚动，确保内容已更新
    setTimeout(scrollToBottom, 10);
  };

  // 生成文档内容
  const handleGenerate = async (type: 'project' | 'agile') => {
    if (!conversationId) {
      alert('无法获取当前会话内容');
      return;
    }

    setGenerating(true);
    setGeneratingType(type);
    
    try {
      // 获取会话消息
      const messages = await getMessages(conversationId);
      
      // 过滤掉system消息，只保留user和assistant消息
      const conversationContent = messages
        .filter((msg: any) => msg.role !== 'system')
        .map((msg: any) => `${msg.role === 'user' ? '用户' : '助手'}: ${msg.content}`)
        .join('\n\n');

      if (!conversationContent.trim()) {
        alert('当前会话无有效内容');
        setGenerating(false);
        setGeneratingType('');
        return;
      }

      // 选择角色配置
      const roleKey = type === 'project' ? '项目经理' : '敏捷教练';
      const roleConfig = ROLE_CONFIGS[roleKey];
      
      if (!roleConfig) {
        alert('未找到对应角色配置');
        setGenerating(false);
        setGeneratingType('');
        return;
      }

      // 调用流式API
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: roleConfig.model,
          messages: [
            {
              role: 'system',
              content: roleConfig.prompt
            },
            {
              role: 'user',
              content: conversationContent
            }
          ],
          stream: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      let buffer = '';
      let accumulatedContent = '';
      let filenameSet = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              setGenerating(false);
              setGeneratingType('');
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              
              if (content) {
                accumulatedContent += content;
                
                // 检查是否包含换行符，如果包含且文件名还未设置，则设置文件名
                if (!filenameSet && accumulatedContent.includes('\n')) {
                  const lines = accumulatedContent.split('\n');
                  const firstLine = lines[0].trim();
                  if (firstLine) {
                    setFormData(prev => ({ 
                      ...prev, 
                      filename: firstLine.replace(/^#+\s*/, ''), // 移除markdown标题标记
                      content: lines.slice(1).join('\n').trim()
                    }));
                    filenameSet = true;
                    // 自动滚动
                    setTimeout(scrollToBottom, 10);
                  }
                } else if (filenameSet) {
                  // 文件名已设置，继续追加内容
                  const lines = accumulatedContent.split('\n');
                  handleContentChange(lines.slice(1).join('\n').trim());
                }
              }
            } catch (parseError) {
              console.warn('解析流式响应失败:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('生成文档失败:', error);
      setErrors({ submit: `生成文档失败: ${(error as any)?.message || error}` });
    } finally {
      setGenerating(false);
      setGeneratingType('');
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
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          width: '100vw',
          height: '100vh',
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
            background: '#f8f9fa',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 24, color: '#333' }}>
            新增文档
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 32,
              cursor: 'pointer',
              color: '#999',
              padding: 0,
              width: 40,
              height: 40,
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
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            padding: '24px',
            overflow: 'hidden'
          }}>
            {errors.submit && (
              <div style={{
                color: '#f44336',
                background: '#ffebee',
                padding: '16px 20px',
                borderRadius: 8,
                marginBottom: 24,
                fontSize: 16,
                border: '1px solid #ffcdd2',
                flexShrink: 0,
              }}>
                {errors.submit}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1, overflow: 'hidden' }}>
              {/* 文件名和分类 */}
              <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 12, fontSize: 16 }}>
                    文件名 *
                  </label>
                  <input
                    type="text"
                    value={formData.filename}
                    onChange={(e) => handleInputChange('filename', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${errors.filename ? '#f44336' : '#e0e0e0'}`,
                      borderRadius: 8,
                      fontSize: 16,
                      boxSizing: 'border-box',
                      fontFamily: 'monospace',
                    }}
                    placeholder="请输入文件名，如：项目需求文档.md"
                    disabled={saving || generating}
                  />
                  {errors.filename && (
                    <div style={{ color: '#f44336', fontSize: 14, marginTop: 8 }}>
                      {errors.filename}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 12, fontSize: 16 }}>
                    分类 *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => handleInputChange('category_id', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${errors.category_id ? '#f44336' : '#e0e0e0'}`,
                      borderRadius: 8,
                      fontSize: 16,
                      boxSizing: 'border-box',
                    }}
                    disabled={saving || generating}
                  >
                    <option value={0}>请选择</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && (
                    <div style={{ color: '#f44336', fontSize: 14, marginTop: 8 }}>
                      {errors.category_id}
                    </div>
                  )}
                </div>
              </div>

              {/* 内容 */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexShrink: 0 }}>
                  <label style={{ fontWeight: 600, fontSize: 16 }}>
                    内容 *
                  </label>
                  {conversationId && (
                    <>
                      <button
                        onClick={() => handleGenerate('project')}
                        disabled={saving || generating}
                        style={{
                          padding: '6px 12px',
                          background: generating && generatingType === 'project' ? '#ccc' : '#4caf50',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          cursor: generating ? 'not-allowed' : 'pointer',
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {generating && generatingType === 'project' ? '生成中...' : '生成项目纪要'}
                      </button>
                      <button
                        onClick={() => handleGenerate('agile')}
                        disabled={saving || generating}
                        style={{
                          padding: '6px 12px',
                          background: generating && generatingType === 'agile' ? '#ccc' : '#2196f3',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          cursor: generating ? 'not-allowed' : 'pointer',
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {generating && generatingType === 'agile' ? '生成中...' : '生成敏捷文档'}
                      </button>
                    </>
                  )}
                </div>
                <textarea
                  ref={contentTextareaRef}
                  value={formData.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  style={{
                    flex: 1,
                    minHeight: 0,
                    padding: '16px',
                    border: `2px solid ${errors.content ? '#f44336' : '#e0e0e0'}`,
                    borderRadius: 8,
                    fontSize: 15,
                    fontFamily: 'monospace',
                    lineHeight: 1.6,
                    resize: 'none',
                    boxSizing: 'border-box',
                    outline: 'none',
                    overflowY: 'auto',
                  }}
                  placeholder={generating ? '正在梳理会话内容...' : '请输入文档内容，支持Markdown格式'}
                  disabled={saving || generating}
                />
                {errors.content && (
                  <div style={{ color: '#f44336', fontSize: 14, marginTop: 8, flexShrink: 0 }}>
                    {errors.content}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div
          style={{
            padding: '20px 24px',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 16,
            flexShrink: 0,
            background: '#f8f9fa',
          }}
        >
          <button
            onClick={onClose}
            disabled={saving || generating}
            style={{
              padding: '12px 24px',
              background: '#f5f5f5',
              color: '#666',
              border: '2px solid #ddd',
              borderRadius: 8,
              cursor: (saving || generating) ? 'not-allowed' : 'pointer',
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving || generating}
            style={{
              padding: '12px 24px',
              background: (saving || generating) ? '#ccc' : '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: (saving || generating) ? 'not-allowed' : 'pointer',
              fontSize: 16,
              fontWeight: 500,
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