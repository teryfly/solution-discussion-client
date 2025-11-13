import {
  getMessages,
  getCompleteSourceCode,
  getConversationReferencedDocuments,
  updateConversationSystemPrompt,
} from '../api';
import { ROLE_CONFIGS } from '../config';
import { Message, ConversationMeta, Project } from '../types';
import { getReferencedDocumentsContent } from '../api/knowledgeContent';
import { useProject } from '../context/ProjectContext'; // Import useProject to get AI work directory

// Helper to estimate token count (simple char count approximation)
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4); // Roughly 4 characters per token
}

export class CommandExecutor {
  private currentMeta: ConversationMeta | undefined;
  private messages: Message[];
  private appendMessage: (msg: Message, replaceLast?: boolean) => void;
  private setSystemPrompt: (prompt: string) => Promise<void>;
  private getProject: () => Project | undefined;
  private getSystemPrompt: () => string; // Function to get current system prompt

  constructor(
    currentMeta: ConversationMeta | undefined,
    messages: Message[],
    appendMessage: (msg: Message, replaceLast?: boolean) => void,
    setSystemPrompt: (prompt: string) => Promise<void>,
    getProject: () => Project | undefined,
    getSystemPrompt: () => string
  ) {
    this.currentMeta = currentMeta;
    this.messages = messages;
    this.appendMessage = appendMessage;
    this.setSystemPrompt = setSystemPrompt;
    this.getProject = getProject;
    this.getSystemPrompt = getSystemPrompt;
  }

  private async copyToClipboardWithFeedback(text: string, successMessage: string, errorMessage: string) {
    try {
      if (!text) {
        throw new Error(errorMessage);
      }
      await navigator.clipboard.writeText(text);
      this.appendMessage({ role: 'system', content: successMessage, collapsed: false });
    } catch (error: any) {
      this.appendMessage({ role: 'system', content: `⚠️ 复制失败: ${error.message || errorMessage}`, collapsed: false });
      console.error('复制失败:', error);
    }
  }

  async execute(command: string, args: string): Promise<boolean> {
    if (!this.currentMeta?.id) {
      this.appendMessage({ role: 'system', content: '⚠️ 无法执行命令：未选择会话。', collapsed: false });
      return false;
    }

    const conversationId = this.currentMeta.id;
    const projectId = this.currentMeta.projectId;
    const currentRole = this.currentMeta.assistanceRole || '通用助手';

    switch (command) {
      case 'copy prompt': {
        const roleConfig = ROLE_CONFIGS[currentRole];
        if (!roleConfig) {
          this.appendMessage({ role: 'system', content: `⚠️ 未知角色: ${currentRole}`, collapsed: false });
          return false;
        }
        const prompt = roleConfig.prompt;
        const tokenCount = estimateTokenCount(prompt);
        await this.copyToClipboardWithFeedback(prompt, `✅ 已复制当前角色 (${currentRole}) 的原始Prompt (${tokenCount} tokens)。`, '当前角色没有配置Prompt。');
        return true;
      }

      case 'copy code': {
        if (!projectId) {
          this.appendMessage({ role: 'system', content: '⚠️ 无法复制代码：会话未关联项目。', collapsed: false });
          return false;
        }
        try {
          const completeSource = await getCompleteSourceCode(projectId);
          const codeSectionMatch = completeSource.match(/--- The File Structure and Source Code of this Project BEGIN---\n([\s\S]*)\n--- Source Code END ---/);
          const codeContent = codeSectionMatch ? codeSectionMatch[1].trim() : '';

          if (!codeContent) {
            this.appendMessage({ role: 'system', content: '⚠️ 当前会话未学习项目源码，或源码内容为空。', collapsed: false });
            return false;
          }
          const tokenCount = estimateTokenCount(codeContent);
          await this.copyToClipboardWithFeedback(codeContent, `✅ 已复制项目源码 (${tokenCount} tokens)。`, '无法获取项目源码内容。');
        } catch (error: any) {
          this.appendMessage({ role: 'system', content: `⚠️ 复制源码失败: ${error.message}`, collapsed: false });
        }
        return true;
      }

      case 'copy knowledge': {
        try {
          const knowledgeContent = await getReferencedDocumentsContent(conversationId);
          if (!knowledgeContent.trim()) {
            this.appendMessage({ role: 'system', content: '⚠️ 当前会话未引用任何知识库文档。', collapsed: false });
            return false;
          }
          const tokenCount = estimateTokenCount(knowledgeContent);
          await this.copyToClipboardWithFeedback(knowledgeContent, `✅ 已复制所有引用知识库文档内容 (${tokenCount} tokens)。`, '无法获取引用知识库文档内容。');
        } catch (error: any) {
          this.appendMessage({ role: 'system', content: `⚠️ 复制知识库失败: ${error.message}`, collapsed: false });
        }
        return true;
      }

      case 'copy pck': {
        const currentSystemPrompt = this.getSystemPrompt(); // Get the current active system prompt
        if (!currentSystemPrompt.trim()) {
          this.appendMessage({ role: 'system', content: '⚠️ 当前会话的System Prompt为空。', collapsed: false });
          return false;
        }
        const tokenCount = estimateTokenCount(currentSystemPrompt);
        await this.copyToClipboardWithFeedback(currentSystemPrompt, `✅ 已复制完整System Prompt (${tokenCount} tokens)。`, '无法获取完整System Prompt内容。');
        return true;
      }

      case 'copy all': {
        const fullSystemPrompt = this.getSystemPrompt();
        const historyMessages = await getMessages(conversationId);
        const allContent = [
          fullSystemPrompt.trim() ? `--- System Prompt BEGIN ---\n${fullSystemPrompt}\n--- System Prompt END ---` : '',
          ...historyMessages.map(msg => `${msg.role.toUpperCase()}:\n${msg.content}`)
        ].filter(Boolean).join('\n\n------\n\n');

        if (!allContent.trim()) {
          this.appendMessage({ role: 'system', content: '⚠️ 会话内容为空。', collapsed: false });
          return false;
        }
        const tokenCount = estimateTokenCount(allContent);
        await this.copyToClipboardWithFeedback(allContent, `✅ 已复制全部会话内容 (包括System Prompt) (${tokenCount} tokens)。`, '无法获取全部会话内容。');
        return true;
      }

      case 'copy msg': {
        const historyMessages = await getMessages(conversationId);
        const userAndAssistantMessages = historyMessages
          .filter(msg => msg.role !== 'system')
          .map(msg => `${msg.role.toUpperCase()}:\n${msg.content}`)
          .filter(Boolean)
          .join('\n\n------\n\n');

        if (!userAndAssistantMessages.trim()) {
          this.appendMessage({ role: 'system', content: '⚠️ 历史消息内容为空。', collapsed: false });
          return false;
        }
        const tokenCount = estimateTokenCount(userAndAssistantMessages);
        await this.copyToClipboardWithFeedback(userAndAssistantMessages, `✅ 已复制所有历史消息 (${tokenCount} tokens)。`, '无法获取历史消息内容。');
        return true;
      }
      
      case 'update prompt': {
        if (!projectId) {
          this.appendMessage({ role: 'system', content: '⚠️ 无法更新Prompt：会话未关联项目。', collapsed: false });
          return false;
        }
        try {
          const roleConfig = ROLE_CONFIGS[currentRole];
          if (!roleConfig) {
            this.appendMessage({ role: 'system', content: `⚠️ 未知角色: ${currentRole}，无法更新Prompt。`, collapsed: false });
            return false;
          }
          let newSystemPrompt = roleConfig.prompt;

          const project = this.getProject();
          if (project?.ai_work_dir || project?.aiWorkDir) { // Check if source code learning is implicitly enabled by AI work dir
            const completeSource = await getCompleteSourceCode(projectId);
            if (completeSource.trim()) {
              newSystemPrompt += `\n\n--- The File Structure and Source Code of this Project BEGIN---\n${completeSource}\n--- Source Code END ---`;
            }
          }
          
          await this.setSystemPrompt(newSystemPrompt);
          const tokenCount = estimateTokenCount(newSystemPrompt);
          this.appendMessage({ role: 'system', content: `✅ System Prompt已更新为最新版本 (${tokenCount} tokens)。`, collapsed: false });
        } catch (error: any) {
          this.appendMessage({ role: 'system', content: `⚠️ 更新Prompt失败: ${error.message}`, collapsed: false });
        }
        return true;
      }

      case 'copy help': {
        const helpText = `可用的命令:
- #teryCMD=copy prompt: 复制当前角色原始Prompt。
- #teryCMD=copy code: 复制项目源码部分。
- #teryCMD=copy knowledge: 复制引用知识库文档。
- #teryCMD=copy pck: 复制完整System Prompt (Prompt + Code + Knowledge)。
- #teryCMD=copy all: 复制完整System Prompt + 所有历史消息。
- #teryCMD=copy msg: 复制所有历史消息 (不含System Prompt)。
- #teryCMD=update prompt: 更新System Prompt为最新版本 (Prompt + Code)。
- #teryCMD=copy help: 显示此帮助信息。`;
        await this.copyToClipboardWithFeedback(helpText, `✅ 已复制命令帮助信息。`, '无法生成帮助信息。');
        return true;
      }

      default:
        this.appendMessage({ role: 'system', content: `⚠️ 命令拼写不正确或不支持的命令: ${command}`, collapsed: false });
        return false;
    }
  }
}