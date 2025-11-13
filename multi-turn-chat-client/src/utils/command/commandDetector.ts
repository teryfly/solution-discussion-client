export function isCommandText(input: string): { isCmd: boolean; name?: string } {
  if (!input) return { isCmd: false };
  const trimmed = input.trim();
  if (/^#teryCMD=.+$/i.test(trimmed)) {
    return { isCmd: true, name: trimmed.slice('#teryCMD='.length).trim() };
  }
  const lines = input.split('\n');
  if (lines.length >= 2) {
    const first = lines[0].trim();
    const last = lines[lines.length - 1].trim();
    if (/^#teryCMD=.+$/i.test(first) && /^#teryCMD$/i.test(last)) {
      return { isCmd: true, name: first.slice('#teryCMD='.length).trim() };
    }
  }
  return { isCmd: false };
}