import { getConversationReferencedDocuments, getDocumentDetail } from '../api';

// Estimate token count: Chinese char = 1, other chars = 0.5
export function estimateTokenCount(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const otherChars = text.replace(/[\u4e00-\u9fff]/g, '').length;
  return Math.ceil(chineseChars + otherChars * 0.5);
}

// Build the same combined content as sending message (knowledgeContent)
export async function buildReferencedKnowledgeContent(conversationId: string): Promise<string> {
  const data = await getConversationReferencedDocuments(conversationId);
  const allReferences = [...(data.project_references || []), ...(data.conversation_references || [])];
  if (allReferences.length === 0) return '';

  const documentsContent = await Promise.all(
    allReferences.map(async (ref) => {
      try {
        const detail = await getDocumentDetail(ref.document_id);
        return {
          filename: detail.filename || `文档${ref.document_id}`,
          content: detail.content || '',
        };
      } catch {
        return null;
      }
    })
  );

  const validDocuments = documentsContent.filter((doc) => doc && doc.content.trim() !== '');

  if (validDocuments.length === 0) return '';

  const knowledgeContent = validDocuments
    .map((doc) => `## ${doc!.filename}\n\n${doc!.content}`)
    .join('\n\n---\n\n');

  return `\n\n=== 知识库引用文档 ===\n\n${knowledgeContent}\n\n=== 知识库引用文档结束 ===\n\n请参考以上知识库文档来回答用户的问题。`;
}