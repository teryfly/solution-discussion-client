// utils/commandHandler.ts
// Command message detection and execution scaffolding

export type CommandResult =
  | { handled: true; message?: string }
  | { handled: false };

export type CommandContext = {
  // future extensibility: pass any data needed
  alert: (msg: string) => void;
  prompt: (msg: string) => Promise<string | null>;
};

export type ParsedCommand = {
  name: string;
  args: string; // raw arguments text between markers
};

const CMD_START_RE = /^#teryCMD=([^\s#]+)\s*$/;
const CMD_END_MARK = '#teryCMD';

export const SUPPORTED_COMMANDS = [
  'copy',
  'copy prompt',
  'copy code',
  'copy knowledge',
  'copy PCK',
  'copy all',
  'copy msg',
  'update prompt',
  'copy help',
];

export function parseCommandMessage(input: string): ParsedCommand | null {
  const text = (input || '').trim();

  // Single line form: "#teryCMD=[command name]"
  const m = text.match(CMD_START_RE);
  if (m && text === m[0]) {
    return { name: normalizeCommandName(m[1]), args: '' };
  }

  // Multi-line form:
  const lines = text.split('\n').map((l) => l.trim());
  if (lines.length >= 2) {
    const start = lines[0].match(CMD_START_RE);
    const end = lines[lines.length - 1] === CMD_END_MARK;
    if (start && end) {
      const args = lines.slice(1, -1).join('\n');
      return { name: normalizeCommandName(start[1]), args };
    }
  }

  return null;
}

function normalizeCommandName(name: string): string {
  return name.trim();
}

function isSupportedCommand(name: string): boolean {
  // Accept exact names and also allow "copy" family synonyms
  if (SUPPORTED_COMMANDS.includes(name)) return true;

  // normalize multiple spaces in "copy ..." variants
  const norm = name.replace(/\s+/g, ' ').toLowerCase();
  return SUPPORTED_COMMANDS.some((c) => c.toLowerCase() === norm);
}

export async function executeCommand(
  cmd: ParsedCommand,
  ctx: CommandContext
): Promise<CommandResult> {
  // Validate command
  if (!isSupportedCommand(cmd.name)) {
    ctx.alert('命令拼写不正确');
    return { handled: true };
  }

  const nameNorm = cmd.name.replace(/\s+/g, ' ').toLowerCase();

  // Commands in development
  const developingCommands: Record<string, string> = {
    'copy prompt': '【copy prompt】开发中',
    'copy code': '【copy code】开发中',
    'copy knowledge': '【copy knowledge】开发中',
    'copy pck': '【copy PCK】开发中',
    'copy all': '【copy all】开发中',
    'copy msg': '【copy msg】开发中',
    'update prompt': '【update prompt】开发中',
  };

  if (nameNorm in developingCommands) {
    ctx.alert(developingCommands[nameNorm]);
    return { handled: true };
  }

  // copy help
  if (nameNorm === 'copy help') {
    const help = [
      '当前支持的命令类型：[command name]',
      ...SUPPORTED_COMMANDS.map((c, i) => `${i + 1}. ${c}`),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(help);
      ctx.alert('已复制帮助到剪贴板');
    } catch {
      ctx.alert(help);
    }
    return { handled: true, message: help };
  }

  // Fallback (should not reach due to checks above)
  ctx.alert('命令已处理');
  return { handled: true };
}