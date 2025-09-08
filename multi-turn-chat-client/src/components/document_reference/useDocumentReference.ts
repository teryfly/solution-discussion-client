import { useEffect, useMemo, useState } from 'react';
import { 
  getKnowledgeDocuments, 
  getProjectDocumentReferences, 
  setProjectDocumentReferences,
  getConversationDocumentReferences,
  setConversationDocumentReferences,
  getPlanCategories
} from '../../api';
import type { DocumentReferenceModalProps } from './types';
import type { KnowledgeDocument } from '../../types';

export function useDocumentReferenceData(props: DocumentReferenceModalProps) {
  const { visible, type, projectId, conversationId } = props;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [availableDocuments, setAvailableDocuments] = useState<KnowledgeDocument[]>([]);
  const [currentReferences, setCurrentReferences] = useState<number[]>([]);
  const [projectReferencedIds, setProjectReferencedIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const cats = await getPlanCategories();
      setCategories(cats || []);

      const docsResponse = await getKnowledgeDocuments(projectId);
      const allDocs = (docsResponse || []).sort((a: any, b: any) => b.id - a.id);

      if (type === 'project') {
        const refsResponse = await getProjectDocumentReferences(projectId);
        const currentRefIds = (refsResponse || []).map((ref: any) => ref.document_id);
        setAvailableDocuments(allDocs);
        setCurrentReferences(currentRefIds);
        setProjectReferencedIds([]);
      } else {
        if (!conversationId) return;
        const [convRefsResponse, projRefsResponse] = await Promise.all([
          getConversationDocumentReferences(conversationId),
          getProjectDocumentReferences(projectId)
        ]);
        const projRefIds = (projRefsResponse || []).map((ref: any) => ref.document_id);
        const selectableDocs = allDocs.filter(doc => !projRefIds.includes(doc.id));
        setAvailableDocuments(selectableDocs);
        const currentRefIds = (convRefsResponse || []).map((ref: any) => ref.document_id);
        setCurrentReferences(currentRefIds);
        setProjectReferencedIds(projRefIds);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadData();
      setActiveCategoryId('all');
    }
    // eslint-disable-next-line
  }, [visible, type, projectId, conversationId]);

  const filteredDocuments = useMemo(() => {
    if (activeCategoryId === 'all') return availableDocuments;
    return availableDocuments.filter(d => d.category_id === activeCategoryId);
  }, [availableDocuments, activeCategoryId]);

  const isAllSelectedInTab = useMemo(() => {
    const ids = filteredDocuments.map(d => d.id);
    return ids.length > 0 && ids.every(id => currentReferences.includes(id));
  }, [filteredDocuments, currentReferences]);

  return {
    loading,
    saving,
    setSaving,
    availableDocuments,
    currentReferences,
    setCurrentReferences,
    projectReferencedIds,
    categories,
    activeCategoryId,
    setActiveCategoryId,
    filteredDocuments,
    isAllSelectedInTab,
    reload: loadData,
  };
}

export function useDocumentReferenceActions(props: DocumentReferenceModalProps, state: ReturnType<typeof useDocumentReferenceData>) {
  const { type, projectId, conversationId, onUpdate, onClose } = props;
  const { currentReferences, setCurrentReferences, filteredDocuments, setSaving, reload } = state;

  const toggleSelect = (documentId: number) => {
    setCurrentReferences(prev => prev.includes(documentId) ? prev.filter(id => id !== documentId) : [...prev, documentId]);
  };

  const selectAllInTab = () => {
    const ids = filteredDocuments.map(d => d.id);
    const allSelected = ids.length > 0 && ids.every(id => currentReferences.includes(id));
    if (allSelected) {
      setCurrentReferences(prev => prev.filter(id => !ids.includes(id)));
    } else {
      const toAdd = ids.filter(id => !currentReferences.includes(id));
      setCurrentReferences(prev => [...prev, ...toAdd]);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      if (type === 'project') {
        await setProjectDocumentReferences(projectId, currentReferences);
      } else if (conversationId) {
        await setConversationDocumentReferences(conversationId, currentReferences);
      }
      onUpdate?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return { toggleSelect, selectAllInTab, save, reload };
}