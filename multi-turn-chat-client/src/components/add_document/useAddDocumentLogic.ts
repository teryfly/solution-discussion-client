import { useEffect, useMemo, useRef, useState } from 'react';
import { BASE_URL, API_KEY } from '../../config';
import { getMessages, createPlanDocument, getPlanCategoryDetail } from '../../api';
import usePlanCategories from '../../hooks/usePlanCategories';
import type { AddDocumentModalProps, FormData, GenerateState } from './types';

export function useAddDocumentLogic(props: AddDocumentModalProps) {
  const { visible, defaultCategoryId, conversationId, projectId, onClose, onSuccess } = props;

  const { categories } = usePlanCategories();
  const [formData, setFormData] = useState<FormData>({ filename: '', content: '', category_id: 0 });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gen, setGen] = useState<GenerateState>({ generating: false, type: '' });
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const initialCategory = useMemo(() => {
    if (typeof defaultCategoryId === 'number' && defaultCategoryId > 0) return defaultCategoryId;
    return 0;
  }, [defaultCategoryId]);

  const resetForm = () => {
    setFormData({ filename: '', content: '', category_id: initialCategory });
    setErrors({});
    setGen({ generating: false, type: '' });
  };

  useEffect(() => {
    if (visible) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialCategory]);

  // 不再需要手动滚动，双栏编辑器会自动处理
  const setContentAndScroll = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value as any }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.filename.trim()) newErrors.filename = '文件名不能为空';
    if (!formData.content.trim()) newErrors.content = '内容不能为空';
    if (formData.category_id === 0) newErrors.category_id = '请选择分类';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
    } catch (e: any) {
      setErrors({ submit: e?.message || '创建文档失败' });
    } finally {
      setSaving(false);
    }
  };

  // 单一入口："根据会话生成"
  const handleGenerate = async () => {
    if (!conversationId) {
      alert('无法获取当前会话内容');
      return;
    }
    if (!formData.category_id || formData.category_id === 0) {
      alert('请先选择分类');
      return;
    }
    setGen({ generating: true, type: 'project' }); // 用于"生成中..."展示

    try {
      // 1) 获取整个会话上下文（去除 system），拼接为单条"用户提问"
      const messages = await getMessages(conversationId);
      const fullConversationAsUserQuestion = (messages || [])
        .filter((m: any) => m.role !== 'system')
        .map((m: any, idx: number) => `${m.role === 'user' ? '用户' : '助手'}(${idx + 1}): ${m.content}`)
        .join('\n\n')
        .trim();

      if (!fullConversationAsUserQuestion) {
        alert('当前会话无有效内容');
        setGen({ generating: false, type: '' });
        return;
      }

      // 2) 获取分类详情：prompt_template + summary_model
      let model = '';
      let promptTemplate = '';
      try {
        const category = await getPlanCategoryDetail(formData.category_id);
        promptTemplate = category?.prompt_template || '';
        model = category?.summary_model || '';
      } catch (e: any) {
        if (String(e?.message || '').includes('404')) {
          setErrors({ submit: '分类不存在（404）' });
          setGen({ generating: false, type: '' });
          return;
        }
        console.warn('获取分类详情失败:', e);
      }

      // 3) 调用后端流式API：system 使用 prompt_template，user 使用"完整会话上下文"
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({
          model, // 正确使用分类返回的 summary_model
          messages: [
            ...(promptTemplate ? [{ role: 'system', content: promptTemplate }] : []),
            { role: 'user', content: fullConversationAsUserQuestion },
          ],
          stream: true,
        }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';
      let accumulated = '';
      let filenameSet = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });

        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') {
            setGen({ generating: false, type: '' });
            return;
          }
          try {
            const json = JSON.parse(payload);
            const delta = json?.choices?.[0]?.delta?.content || '';
            if (!delta) continue;

            accumulated += delta;

            // 第一行作为文件名（收到首个换行后生效）
            if (!filenameSet && accumulated.includes('\n')) {
              const parts = accumulated.split('\n');
              const firstLine = parts[0].trim().replace(/^#+\s*/, '');
              const rest = parts.slice(1).join('\n').trim();
              setFormData(prev => ({ ...prev, filename: firstLine || prev.filename, content: rest }));
              filenameSet = true;
            } else if (filenameSet) {
              const parts = accumulated.split('\n');
              const rest = parts.slice(1).join('\n').trim();
              setContentAndScroll(rest);
            }
          } catch {
            // 忽略单行解析错误
          }
        }
      }
    } catch (e: any) {
      setErrors({ submit: `生成文档失败: ${e?.message || e}` });
    } finally {
      setGen({ generating: false, type: '' });
    }
  };

  return {
    categories,
    contentTextareaRef,
    formData,
    errors,
    saving,
    gen,
    handleInputChange,
    setContentAndScroll,
    handleSave,
    handleGenerate,
  };
}