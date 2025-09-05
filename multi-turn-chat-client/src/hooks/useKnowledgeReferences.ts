import { useState, useEffect } from 'react';
import { DocumentReference, KnowledgeDocument } from '../types';
import {
  getConversationReferencedDocuments,
  getKnowledgeDocuments,
  getProjectDocumentReferences,
  getConversationDocumentReferences
} from '../api';

export function useKnowledgeReferences(conversationId: string, projectId?: number) {
  const [projectReferences, setProjectReferences] = useState<DocumentReference[]>([]);
  const [conversationReferences, setConversationReferences] = useState<DocumentReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReferences = async () => {
    if (!conversationId) {
      setProjectReferences([]);
      setConversationReferences([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getConversationReferencedDocuments(conversationId);
      setProjectReferences(data.project_references || []);
      setConversationReferences(data.conversation_references || []);
    } catch (err) {
      console.error('加载引用文档失败:', err);
      setError((err as any)?.message || '加载引用文档失败');
      setProjectReferences([]);
      setConversationReferences([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferences();
  }, [conversationId]);

  return {
    projectReferences,
    conversationReferences,
    loading,
    error,
    refresh: loadReferences
  };
}

export function useKnowledgeDocuments(projectId?: number) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = async () => {
    if (typeof projectId !== 'number') {
      setDocuments([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // fetch all documents of a project (no category filter)
      const docs = await getKnowledgeDocuments(projectId);
      setDocuments(docs || []);
    } catch (err) {
      console.error('加载知识库文档失败:', err);
      setError((err as any)?.message || '加载知识库文档失败');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [projectId]);

  return {
    documents,
    loading,
    error,
    refresh: loadDocuments
  };
}

export function useProjectReferences(projectId?: number) {
  const [references, setReferences] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReferences = async () => {
    if (typeof projectId !== 'number') {
      setReferences([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const refs = await getProjectDocumentReferences(projectId);
      setReferences(refs || []);
    } catch (err) {
      console.error('加载项目引用失败:', err);
      setError((err as any)?.message || '加载项目引用失败');
      setReferences([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferences();
  }, [projectId]);

  return {
    references,
    loading,
    error,
    refresh: loadReferences
  };
}

export function useConversationReferences(conversationId: string) {
  const [references, setReferences] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReferences = async () => {
    if (!conversationId) {
      setReferences([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const refs = await getConversationDocumentReferences(conversationId);
      setReferences(refs || []);
    } catch (err) {
      console.error('加载会话引用失败:', err);
      setError((err as any)?.message || '加载会话引用失败');
      setReferences([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferences();
  }, [conversationId]);

  return {
    references,
    loading,
    error,
    refresh: loadReferences
  };
}