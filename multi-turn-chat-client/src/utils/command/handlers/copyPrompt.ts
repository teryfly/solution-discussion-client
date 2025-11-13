import { CommandContext, CopyResult } from '../types';
import { getConversationReferencedDocuments, getProjectDetail, getCompleteSourceCode } from '../../../api';
import { approxTokenCount } from '../../tokenCount';
import { copyToClipboard } from '../../clipboard';

// Helper: get base system prompt of the role (without code and knowledge).
// Current codebase does not store per-conversation system prompt content.
// We fallback: role prompt from ROLE_CONFIGS via backend conversation meta is not directly accessible here.
// For now, we attempt to fetch by conversation detail? Not available. We will return error.
export async function handleCopyPrompt(ctx: CommandContext): Promise<CopyResult> {
  return {
    ok: false,
    title: '复制失败',
    message: '无法获取当前会话的系统提示词（system prompt）。请提供获取system prompt的API或在会话元数据中存储。'
  };
}