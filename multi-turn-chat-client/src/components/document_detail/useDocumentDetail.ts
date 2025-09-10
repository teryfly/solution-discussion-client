import { useState, useEffect, useRef } from 'react';
import { DocumentDetailModalProps, DocumentDetailState } from './types';
import { getDocumentDetail, updateDocument } from '../../api';

export function useDocumentDetail(props: DocumentDetailModalProps) {
  const { visible, document, onUpdate, onDocumentChange, onClose } = props;

  const [state, setState] = useState<DocumentDetailState>({
    loading: false,
    saving: false,
    documentDetail: null,
    editMode: false,
    filename: '',
    content: '',
    currentDocumentId: document.document_id,
  });

  // refs for synchronized scrolling and edit mode
  const lineColRef = useRef<HTMLDivElement>(null);
  const contentColRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 同步滚动逻辑
  useEffect(() => {
    const lineEl = lineColRef.current;
    const contEl = contentColRef.current;
    if (!lineEl || !contEl || state.editMode) return;

    const onContentScroll = () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      lineEl.scrollTop = contEl.scrollTop;
      requestAnimationFrame(() => (isSyncingRef.current = false));
    };

    const onWheelOnLines = (e: WheelEvent) => {
      if (!contEl) return;
      e.preventDefault();
      contEl.scrollTop += e.deltaY;
    };

    contEl.addEventListener('scroll', onContentScroll);
    lineEl.addEventListener('wheel', onWheelOnLines, { passive: false });

    return () => {
      contEl.removeEventListener('scroll', onContentScroll);
      lineEl.removeEventListener('wheel', onWheelOnLines as any);
    };
  }, [visible, state.editMode]);

  // 加载文档详情
  const loadDocumentDetail = async (docId: number) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const detail = await getDocumentDetail(docId);
      setState(prev => ({
        ...prev,
        documentDetail: detail,
        filename: detail.filename || '',
        content: detail.content || '',
        currentDocumentId: docId,
        loading: false,
      }));
    } catch (error) {
      console.error('加载文档详情失败:', error);
      alert('加载文档详情失败: ' + (error as any)?.message);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // 初始化加载
  useEffect(() => {
    if (visible) {
      loadDocumentDetail(document.document_id);
      setState(prev => ({ ...prev, editMode: false }));
    }
  }, [visible, document.document_id]);

  // 编辑模式聚焦处理（修复光标跳动问题）
  useEffect(() => {
    if (state.editMode && textareaRef.current) {
      // 仅在首次进入编辑模式时聚焦，不重设光标位置
      textareaRef.current.focus();
    }
  }, [state.editMode]);

  // 保存文档
  const handleSave = async () => {
    if (!state.filename.trim()) {
      alert('文件名不能为空');
      return;
    }

    setState(prev => ({ ...prev, saving: true }));
    try {
      const updatedDoc = await updateDocument(state.currentDocumentId, {
        filename: state.filename.trim(),
        content: state.content,
        source: 'user',
      });

      if (updatedDoc.id && updatedDoc.id !== state.currentDocumentId) {
        setState(prev => ({ ...prev, currentDocumentId: updatedDoc.id }));
        onDocumentChange?.(updatedDoc.id);
        await loadDocumentDetail(updatedDoc.id);
      } else {
        await loadDocumentDetail(state.currentDocumentId);
      }

      setState(prev => ({ ...prev, editMode: false, saving: false }));
      onUpdate?.();
    } catch (error) {
      console.error('保存文档失败:', error);
      alert('保存文档失败: ' + (error as any)?.message);
      setState(prev => ({ ...prev, saving: false }));
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    if (state.documentDetail) {
      setState(prev => ({
        ...prev,
        filename: state.documentDetail.filename || '',
        content: state.documentDetail.content || '',
        editMode: false,
      }));
    }
  };

  // 键盘快捷键
  useEffect(() => {
    if (!visible) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (state.editMode) {
          handleCancelEdit();
        } else {
          onClose();
        }
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && state.editMode) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [visible, state.editMode, state.filename, state.content]);

  // 更新状态的辅助函数
  const updateState = (updates: Partial<DocumentDetailState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const setFilename = (filename: string) => updateState({ filename });
  const setContent = (content: string) => updateState({ content });
  const setEditMode = (editMode: boolean) => updateState({ editMode });

  return {
    state,
    refs: {
      lineColRef,
      contentColRef,
      textareaRef,
    },
    actions: {
      handleSave,
      handleCancelEdit,
      setFilename,
      setContent,
      setEditMode,
    },
  };
}