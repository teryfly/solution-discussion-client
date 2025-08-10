function isWindowsAbsolutePath(p: string): boolean {
  return /^[a-zA-Z]:\\/.test(p) || /^\\\\/.test(p);
}
function isPosixAbsolutePath(p: string): boolean {
  return p.startsWith('/');
}
export function isAbsolutePath(p?: string): boolean {
  if (!p) return false;
  return isWindowsAbsolutePath(p) || isPosixAbsolutePath(p);
}
function toWindowsSeparators(p: string): string {
  return p.replace(/\//g, '\\');
}
function toPosixSeparators(p: string): string {
  return p.replace(/\\/g, '/');
}
function trimLeadingSeparators(p: string, sep: '/' | '\\'): string {
  const re = sep === '/' ? /^\/+/ : /^\\+/;
  return p.replace(re, '');
}
function trimTrailingSeparators(p: string, sep: '/' | '\\'): string {
  const re = sep === '/' ? /\/+$/ : /\\+$/;
  return p.replace(re, '');
}
function joinWithSep(sep: '/' | '\\', ...parts: string[]): string {
  const cleaned = parts
    .filter(Boolean)
    .map((s) => (sep === '/' ? toPosixSeparators(s) : toWindowsSeparators(s)))
    .map((s, idx) => {
      s = trimTrailingSeparators(s, sep);
      return idx === 0 ? s : trimLeadingSeparators(s, sep);
    })
    .filter((s) => s.length > 0);
  if (cleaned.length === 0) return '';
  return cleaned.join(sep);
}
export function buildFullPath(aiWorkDir: string, dirPath?: string, fileName?: string): string {
  const isWin = isWindowsAbsolutePath(aiWorkDir);
  const sep: '/' | '\\' = isWin ? '\\' : '/';
  let dir = dirPath || '';
  dir = isWin ? toWindowsSeparators(dir) : toPosixSeparators(dir);
  const base = trimTrailingSeparators(aiWorkDir, sep);
  const rel = trimLeadingSeparators(dir, sep);
  if (fileName) {
    return joinWithSep(sep, base, rel, fileName);
  }
  return joinWithSep(sep, base, rel);
}
function sanitizeForFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_');
}
export function buildDisplayFileName(
  aiWorkDir: string | undefined,
  dirPath: string | undefined,
  fileName: string | undefined
): string | undefined {
  if (!fileName) return undefined;
  if (!aiWorkDir || !isAbsolutePath(aiWorkDir)) {
    return fileName;
  }
  const full = buildFullPath(aiWorkDir, dirPath, fileName);
  return sanitizeForFilename(full);
}