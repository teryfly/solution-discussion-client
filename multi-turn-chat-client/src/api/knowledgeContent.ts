import { getConversationReferencedDocuments } from './chat';
import { getDocumentDetail } from './knowledge';

export async function getReferencedDocumentsContent(conversationId: string): Promise<string> {
  try {
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
        } catch (error) {
          console.warn(`获取文档${ref.document_id}内容失败:`, error);
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
  } catch (error) {
    console.warn('获取引用文档内容失败:', error);
    return '';
  }
}