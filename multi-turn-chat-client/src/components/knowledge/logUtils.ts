export type ExecLog = {
  id: string;
  message: string;
  type: string;
  timestamp: string;
  data?: any;
};

export function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return ts;
  }
}

export function getFirstLineFromFilesContent(data: any): string {
  if (!data) return '';
  try {
    const content = typeof data === 'string' ? data : (data.files_content ?? '');
    if (!content || typeof content !== 'string') return '';
    const firstLine = content.split('\n')[0] || '';
    return firstLine.trim();
  } catch {
    return '';
  }
}

// Do not filter any types. Only map labels for display.
export function getDisplayType(type: string, data: any): string {
  const lowerType = (type || '').toLowerCase();
  if (lowerType === 'info') return 'info';
  if (lowerType === 'success') return 'success';
  if (lowerType === 'error') return '失败';
  if (lowerType === 'warning') {
    const raw = JSON.stringify(data || '').toLowerCase();
    if (raw.includes('invalid') || raw.includes('无效')) return '无效';
    return 'warning';
  }
  return type;
}

export function getLogTypeStyle(displayType: string): React.CSSProperties {
  switch (displayType) {
    case '失败':
      return { color: '#f44336', fontWeight: 'bold' };
    case '无效':
      return { color: '#9e9e9e', fontWeight: 'bold' };
    case 'info':
      return { color: '#2196f3', fontWeight: 'bold' };
    case 'success':
      return { color: '#4caf50', fontWeight: 'bold' };
    case 'warning':
      return { color: '#ff9800', fontWeight: 'bold' };
    case 'summary':
      return { color: '#9c27b0', fontWeight: 'bold' };
    default:
      return { color: '#666' };
  }
}

export function formatExecutionSummary(summary: any): string {
  if (!summary) return '';
  const successful = Number(summary.successful_tasks ?? 0);
  const failed = Number(summary.failed_tasks ?? 0);
  const invalid = Number(summary.invalid_tasks ?? 0);
  return `成功${successful}, 失败${failed}, 无效${invalid}`;
}

export function buildLogBody(log: ExecLog): string {
  const displayType = getDisplayType(log.type, log.data);
  const lowerType = (log.type || '').toLowerCase();

  if (lowerType === 'summary' && typeof log.data === 'object' && log.data) {
    return formatExecutionSummary(log.data);
  }

  let base = (typeof log.message === 'string' ? log.message : '') || '';

  const details: string[] = [];
  if (lowerType === 'info' || lowerType === 'success' || lowerType === 'warning') {
    if (log.data && typeof log.data === 'object') {
      const d = log.data as any;
      if (typeof d.task === 'string' && d.task) details.push(`Task: ${d.task}`);
      if (typeof d.file === 'string' && d.file) details.push(`File: ${d.file}`);
      if (typeof d.path === 'string' && d.path) details.push(`Path: ${d.path}`);
      if (typeof d.operation === 'string' && d.operation) details.push(`Op: ${d.operation}`);
      if (typeof d.status === 'string' && d.status) details.push(`Status: ${d.status}`);
      if (typeof d.result === 'string' && d.result) details.push(`Result: ${d.result}`);
      if (typeof d.note === 'string' && d.note) details.push(`Note: ${d.note}`);
      if (typeof d.warn === 'string' && d.warn) details.push(`Warn: ${d.warn}`);
      if (details.length === 0) {
        try { details.push(JSON.stringify(d, null, 2)); } catch {}
      }
    } else if (typeof log.data === 'string' && log.data.trim()) {
      details.push(log.data.trim());
    }
  }

  if (displayType === '失败' || displayType === '无效') {
    const firstLine = getFirstLineFromFilesContent(log.data);
    if (firstLine) details.push(firstLine);
  }

  if (!base && details.length > 0) base = details.shift() as string;

  const bodyLines: string[] = [];
  if (base) bodyLines.push(base);
  if (details.length > 0) bodyLines.push(...details);

  if (bodyLines.length === 0) {
    if (typeof log.data === 'string') return log.data;
    if (log.data && typeof log.data === 'object') {
      try { return JSON.stringify(log.data, null, 2); } catch { return String(log.data); }
    }
  }

  return bodyLines.join('\n');
}