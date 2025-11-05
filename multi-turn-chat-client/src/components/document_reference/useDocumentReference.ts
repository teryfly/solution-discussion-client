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

function fuzzyIncludes(target: string, query: string): boolean {
  if (!query.trim()) return true;
  const t = (target || '').toLowerCase();
  const q = query.toLowerCase();
  if (t.includes(q)) return true;
  // simple subsequence fuzzy
  let i = 0;
  for (const ch of t) {
    if (ch === q[i]) i++;
    if (i === q.length) return true;
  }
  return false;
}

function reduceToLatestByFilename(docs: KnowledgeDocument[]): KnowledgeDocument[] {
  const map = new Map<string, KnowledgeDocument>();
  for (const d of docs) {
    const key = (d.filename || '').trim();
    const prev = map.get(key);
    if (!prev || d.id > prev.id) {
      map.set(key, d);
    }
  }
  const kept = Array.from(map.values());
  kept.sort((a, b) => b.id - a.id);
  return kept;
}

export function useDocumentReferenceData(props: DocumentReferenceModalProps) {
  const { visible, type, projectId, conversationId } = props;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [availableDocuments, setAvailableDocuments] = useState<KnowledgeDocument[]>([]);
  const [currentReferences, setCurrentReferences] = useState<number[]>([]);
  const [projectReferencedIds, setProjectReferencedIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all');

  // filters
  const [latestOnly, setLatestOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // category filter
  const categoryFiltered = useMemo(() => {
    if (activeCategoryId === 'all') return availableDocuments;
    return availableDocuments.filter(d => d.category_id === activeCategoryId);
  }, [availableDocuments, activeCategoryId]);

  // fuzzy search ONLY on filename (title)
  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return categoryFiltered;
    const q = searchQuery.trim();
    return categoryFiltered.filter(d => fuzzyIncludes(d.filename || '', q));
  }, [categoryFiltered, searchQuery]);

  // latest-only reduction (AND relationship with search)
  const latestFiltered = useMemo(() => {
    if (!latestOnly) return searchFiltered;
    return reduceToLatestByFilename(searchFiltered);
  }, [searchFiltered, latestOnly]);

  const filteredDocuments = latestFiltered;

  const isAllSelectedInTab = useMemo(() => {
    const ids = filteredDocuments.map(d => d.id);
    return ids.length > 0 && ids.every(id => currentReferences.includes(id));
  }, [filteredDocuments, currentReferences]);

  const selectedCountInFiltered = useMemo(() => {
    const ids = new Set(filteredDocuments.map(d => d.id));
    return currentReferences.filter(id => ids.has(id)).length;
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
    // filters
    latestOnly,
    setLatestOnly,
    searchQuery,
    setSearchQuery,
    selectedCountInFiltered,
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