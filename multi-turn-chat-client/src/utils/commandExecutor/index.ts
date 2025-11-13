// utils/commandExecutor/index.ts
import { ROLE_CONFIGS } from '../../config';
import { getCompleteSourceCode } from '../../api/projects';
import { getReferencedDocumentsContent, getMessages } from '../../api';
import { updateConversationSystemPrompt } from '../../api/chat';

export type CommandResult = {
  ok: boolean;
  message: string;
  copied?: boolean;
  tokens?: number;
};

export type CommandContext = {
  conversationId: string;
  projectId?: number;
  roleName?: string;
  copyToClipboard: (text: string) => Promise<void>;
};

export type CommandHandler = (ctx: CommandContext, args: string) => Promise<CommandResult>;

const registry = new Map<string, CommandHandler>();

function approxTokens(s: string): number {
  if (!s) return 0;
  const chinese = (s.match(/[\u4e00-\u9fff]/g) || []).length;
  const others = s.length - chinese;
  return Math.ceil(chinese + others * 0.5);
}

function getRolePrompt(roleName?: string): string | null {
  if (!roleName) return null;
  const entry = ROLE_CONFIGS[roleName];
  return entry?.prompt || null;
}

function extractSourceSection(fullPrompt: string): string | null {
  if (!fullPrompt) return null;
  const begin = '--- The File Structure and Source Code of this Project BEGIN---';
  const end = '--- Source Code END ---';
  const startIdx = fullPrompt.indexOf(begin);
  const endIdx = fullPrompt.indexOf(end);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;
  return fullPrompt.slice(startIdx, endIdx + end.length);
}

async function handleCopyPrompt(ctx: CommandContext): Promise<CommandResult> {
  const prompt = getRolePrompt(ctx.roleName || '通用助手');
  if (!prompt) return { ok: false, message: '未找到当前角色的系统提示词配置' };
  await ctx.copyToClipboard(prompt);
  return { ok: true, message: 'System Prompt 已复制', copied: true, tokens: approxTokens(prompt) };
}

async function handleCopyCode(ctx: CommandContext): Promise<CommandResult> {
  const prompt = getRolePrompt(ctx.roleName || '通用助手');
  if (!prompt) return { ok: false, message: '未找到当前角色的系统提示词配置' };
  const section = extractSourceSection(prompt);
  if (!section) return { ok: false, message: '未找到项目源码片段（未勾选学习项目源码）' };
  await ctx.copyToClipboard(section);
  return { ok: true, message: `源码片段已复制，约 ${approxTokens(section)} tokens`, copied: true, tokens: approxTokens(section) };
}

async function handleCopyKnowledge(ctx: CommandContext): Promise<CommandResult> {
  const content = await getReferencedDocumentsContent(ctx.conversationId);
  const trimmed = content?.trim();
  if (!trimmed) return { ok: false, message: '当前会话没有引用任何知识库文档' };
  await ctx.copyToClipboard(trimmed);
  return { ok: true, message: `知识库拼接内容已复制，约 ${approxTokens(trimmed)} tokens`, copied: true, tokens: approxTokens(trimmed) };
}

async function buildFullPCK(ctx: CommandContext): Promise<string> {
  const rolePrompt = getRolePrompt(ctx.roleName || '通用助手') || '';
  const knowledge = await getReferencedDocumentsContent(ctx.conversationId);
  const parts: string[] = [rolePrompt];
  if (knowledge && knowledge.trim()) parts.push(knowledge.trim());
  return parts.filter(Boolean).join('\n');
}

async function handleCopyPCK(ctx: CommandContext): Promise<CommandResult> {
  const full = await buildFullPCK(ctx);
  if (!full.trim()) return { ok: false, message: '无法构建完整System Prompt内容' };
  await ctx.copyToClipboard(full);
  return { ok: true, message: `完整System Prompt已复制，约 ${approxTokens(full)} tokens`, copied: true, tokens: approxTokens(full) };
}

async function handleCopyAll(ctx: CommandContext): Promise<CommandResult> {
  const fullPCK = await buildFullPCK(ctx);
  const msgs = await getMessages(ctx.conversationId);
  const body = (msgs || [])
    .map(m => `${m.role}: ${m.content}`)
    .join('\n\n');
  const all = `${fullPCK}\n\n===== Conversation History =====\n\n${body}`;
  await ctx.copyToClipboard(all);
  return { ok: true, message: `已复制全部内容，约 ${approxTokens(all)} tokens`, copied: true, tokens: approxTokens(all) };
}

async function handleCopyMsg(ctx: CommandContext): Promise<CommandResult> {
  const msgs = await getMessages(ctx.conversationId);
  const body = (msgs || [])
    .filter(m => m.role !== 'system')
    .map(m => `${m.role}: ${m.content}`)
    .join('\n\n');
  if (!body.trim()) return { ok: false, message: '无可复制的历史消息' };
  await ctx.copyToClipboard(body);
  return { ok: true, message: `已复制历史消息，约 ${approxTokens(body)} tokens`, copied: true, tokens: approxTokens(body) };
}

async function handleUpdatePrompt(ctx: CommandContext): Promise<CommandResult> {
  const rolePrompt = getRolePrompt(ctx.roleName || '通用助手') || '';
  let finalSystem = rolePrompt;
  if (ctx.projectId && ctx.projectId > 0) {
    try {
      const completeSource = await getCompleteSourceCode(ctx.projectId);
      if (completeSource && completeSource.trim()) {
        finalSystem += `\n\n--- The File Structure and Source Code of this Project BEGIN---\n${completeSource}\n--- Source Code END ---`;
      }
    } catch (e: any) {}
  }
  await updateConversationSystemPrompt(ctx.conversationId, finalSystem);
  return { ok: true, message: '系统提示词已更新' };
}

async function handleCopyHelp(): Promise<CommandResult> {
  const lines = [
    '可用命令 [command name]:',
    '1) copy prompt',
    '2) copy code',
    '3) copy knowledge',
    '4) copy PCK',
    '5) copy all',
    '6) copy msg',
    '7) update prompt',
    '8) copy help',
  ];
  return { ok: true, message: lines.join('\n') };
}

function registerDefaults() {
  registry.set('copy prompt', handleCopyPrompt);
  registry.set('copy code', handleCopyCode);
  registry.set('copy knowledge', handleCopyKnowledge);
  registry.set('copy pck', handleCopyPCK);
  registry.set('copy all', handleCopyAll);
  registry.set('copy msg', handleCopyMsg);
  registry.set('update prompt', handleUpdatePrompt);
  registry.set('copy help', handleCopyHelp);
}
registerDefaults();

export async function executeCommand(
  ctx: CommandContext,
  command: { name: string; args: string }
): Promise<CommandResult> {
  const handler = registry.get(command.name);
  if (!handler) {
    return { ok: false, message: '命令拼写不正确' };
  }
  try {
    return await handler(ctx, command.args || '');
  } catch (e: any) {
    return { ok: false, message: e?.message || String(e) };
  }
}