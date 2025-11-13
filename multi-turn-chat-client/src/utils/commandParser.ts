// utils/commandParser.ts
export type ParsedCommand = {
  name: string; // normalized command name key
  rawName: string; // original extracted command name
  args: string; // command payload between markers (may be empty)
};

/**
 * Normalize command name for registry lookup:
 * - trim, lowercase, collapse spaces
 */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Check if input is a command message.
 * Rules:
 * - Single line: "#teryCMD=[command name]"
 * - Multi-line: first line starts with "#teryCMD=[command name]", last line equals "#teryCMD"
 */
export function isCommandMessage(input: string): boolean {
  const text = (input || '').trim();
  if (!text) return false;

  // Single line form
  if (/^#teryCMD=\s*.+$/i.test(text)) {
    return true;
  }

  const lines = text.split('\n');
  if (lines.length >= 2) {
    const first = lines[0].trim();
    const last = lines[lines.length - 1].trim();
    if (/^#teryCMD=\s*.+$/i.test(first) && /^#teryCMD$/i.test(last)) {
      return true;
    }
  }
  return false;
}

/**
 * Parse command from input.
 * Returns null if not a command.
 */
export function parseCommand(input: string): ParsedCommand | null {
  if (!isCommandMessage(input)) return null;
  const text = input.trim();

  // Single line form
  if (/^#teryCMD=\s*.+$/i.test(text)) {
    const rawName = text.replace(/^#teryCMD=/i, '').trim();
    return {
      name: normalizeName(rawName),
      rawName,
      args: '',
    };
  }

  // Multi-line form
  const lines = text.split('\n');
  const first = lines[0].trim();
  const last = lines[lines.length - 1].trim();

  if (!/^#teryCMD=\s*.+$/i.test(first) || !/^#teryCMD$/i.test(last)) {
    return null;
  }

  const rawName = first.replace(/^#teryCMD=/i, '').trim();
  const body = lines.slice(1, -1).join('\n');
  return {
    name: normalizeName(rawName),
    rawName,
    args: body,
  };
}