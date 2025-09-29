import React from 'react';
import type { FormData, GenerateState } from './types';
import DualPaneEditor from '../document_detail/DualPaneEditor';

export const AddDocumentForm: React.FC<{
  formData: FormData;
  errors: Record<string, string>;
  categories: { id: number; name: string }[];
  onChange: (field: keyof FormData, value: string | number) => void;
  onGenerate?: () => void;
  gen: GenerateState;
  contentRef: React.RefObject<HTMLTextAreaElement>;
  showGenerateButtons?: boolean;
}> = ({
  formData,
  errors,
  categories,
  onChange,
  onGenerate,
  gen,
  contentRef,
  showGenerateButtons = true
}) => {
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          overflow: 'hidden',
        }}
      >
        {errors.submit && (
          <div
            style={{
              color: '#f44336',
              background: '#ffebee',
              padding: '16px 20px',
              borderRadius: 8,
              marginBottom: 24,
              fontSize: 16,
              border: '1px solid #ffcdd2',
              flexShrink: 0,
            }}
          >
            {errors.submit}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 12, fontSize: 16 }}>文件名 *</label>
              <input
                type="text"
                value={formData.filename}
                onChange={(e) => onChange('filename', e.target.value)}
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
                disabled={gen.generating}
              />
              {errors.filename && (
                <div style={{ color: '#f44336', fontSize: 14, marginTop: 8 }}>{errors.filename}</div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 12, fontSize: 16 }}>分类 *</label>
              <select
                value={formData.category_id}
                onChange={(e) => onChange('category_id', Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `2px solid ${errors.category_id ? '#f44336' : '#e0e0e0'}`,
                  borderRadius: 8,
                  fontSize: 16,
                  boxSizing: 'border-box',
                }}
                disabled={gen.generating}
              >
                <option value={0}>请选择</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <div style={{ color: '#f44336', fontSize: 14, marginTop: 8 }}>{errors.category_id}</div>
              )}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {showGenerateButtons && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 12,
                  flexShrink: 0,
                }}
              >
                <label style={{ fontWeight: 600, fontSize: 16 }}>内容 *</label>
                <button
                  onClick={() => onGenerate && onGenerate()}
                  disabled={gen.generating}
                  style={{
                    padding: '6px 12px',
                    background: gen.generating ? '#ccc' : '#1a73e8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: gen.generating ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {gen.generating ? '生成中...' : '根据会话生成'}
                </button>
              </div>
            )}

            {!showGenerateButtons && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 12,
                  flexShrink: 0,
                }}
              >
                <label style={{ fontWeight: 600, fontSize: 16 }}>内容 *</label>
              </div>
            )}

            {/* 使用双栏编辑器 */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <DualPaneEditor
                content={formData.content}
                filename={formData.filename}
                onContentChange={(content) => onChange('content', content)}
                placeholder={gen.generating ? '正在梳理会话内容...' : '请输入文档内容，支持Markdown格式'}
                disabled={gen.generating}
                showPreview={true}
                initialLeftRatio={0.4}
              />
            </div>
            
            {errors.content && (
              <div style={{ color: '#f44336', fontSize: 14, marginTop: 8, flexShrink: 0 }}>{errors.content}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};