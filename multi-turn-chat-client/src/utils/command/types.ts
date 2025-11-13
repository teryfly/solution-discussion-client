export type CommandName =
  | 'copy prompt'
  | 'copy code'
  | 'copy knowledge'
  | 'copy pck'
  | 'copy all'
  | 'update code';

export interface ParsedCommand {
  name: CommandName;
  params: string; // text between two markers (may be empty)
  raw: string;
}

export interface CommandContext {
  conversationId: string;
  currentProjectId?: number;
  currentMeta?: {
    assistanceRole?: string;
  };
}

export interface CommandResult {
  ok: boolean;
  title: string;
  message: string;
}

export type CommandHandler = (ctx: CommandContext) => Promise<CommandResult>;

export interface CopyResult extends CommandResult {
  copiedText?: string;
  count?: number;
}