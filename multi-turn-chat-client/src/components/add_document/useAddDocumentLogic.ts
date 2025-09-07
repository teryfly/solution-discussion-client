import { useEffect, useMemo, useRef, useState } from 'react';
import { BASE_URL, API_KEY, ROLE_CONFIGS } from '../../config';
import { getMessages, createPlanDocument } from '../../api';
import usePlanCategories from '../../hooks/usePlanCategories';
import type { AddDocumentModalProps, FormData, GenerateState, GenerateType } from './types';

export function useAddDocumentLogic(props: AddDocumentModalProps) {
  const { visible, defaultCategoryId, conversationId, projectId, onClose, onSuccess } = props;

  const { categories } = usePlanCategories();
  const [formData, setFormData] = useState<FormData>({ filename: '', content: '', category_id: 0 });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gen, setGen] = useState<GenerateState>({ generating: false, type: '' });
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 复用：两个入口共享逻辑
  // 入口分类默认值：只有通过“编辑引用弹窗+新增文档”且 TAB 为具体分类时(defaultCategoryId>0)才预选分类，否则为“请选择”(0)
  const initialCategory = useMemo(() => {
    if (typeof defaultCategoryId === 'number' && defaultCategoryId > 0) return defaultCategoryId;
    return 0; // 其余入口均选择“请选择”
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

  // 滚动到底部
  const scrollToBottom = () => {
    if (contentTextareaRef.current) {
      contentTextareaRef.current.scrollTop = contentTextareaRef.current.scrollHeight;
    }
  };

  const setContentAndScroll = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
    setTimeout(scrollToBottom, 10);
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

  // 生成按钮：两个入口都可用（会话ID可选）
  const handleGenerate = async (type: GenerateType) => {
    if (!conversationId) {
      alert('无法获取当前会话内容');
      return;
    }
    setGen({ generating: true, type });

    try {
      // 拼接会话内容（去除 system）
      const messages = await getMessages(conversationId);
      const conversationContent = (messages || [])
        .filter((m: any) => m.role !== 'system')
        .map((m: any) => `${m.role === 'user' ? '用户' : '助手'}: ${m.content}`)
        .join('\n\n')
        .trim();

      if (!conversationContent) {
        alert('当前会话无有效内容');
        setGen({ generating: false, type: '' });
        return;
      }

      const roleKey = type === 'project' ? '项目经理' : '敏捷教练';
      const role = ROLE_CONFIGS[roleKey];
      if (!role) {
        alert('未找到对应角色配置');
        setGen({ generating: false, type: '' });
        return;
      }

      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({
          model: role.model,
          messages: [
            { role: 'system', content: role.prompt },
            { role: 'user', content: conversationContent },
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

            // 2、确保收到换行符后再写入第一行文件名
            if (!filenameSet && accumulated.includes('\n')) {
              const parts = accumulated.split('\n');
              const firstLine = parts[0].trim().replace(/^#+\s*/, '');
              const rest = parts.slice(1).join('\n').trim();
              setFormData(prev => ({ ...prev, filename: firstLine, content: rest }));
              filenameSet = true;
              setTimeout(scrollToBottom, 10);
            } else if (filenameSet) {
              const parts = accumulated.split('\n');
              const rest = parts.slice(1).join('\n').trim();
              setContentAndScroll(rest);
            } else {
              // 尚未收到首个换行，提示文案
              setFormData(prev => ({
                ...prev,
                content: prev.content || '',
              }));
            }
          } catch {
            // ignore parse error
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