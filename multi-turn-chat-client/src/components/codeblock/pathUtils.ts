import { FilePathInfo } from './types';
// 从完整内容中查找当前代码块对应的File Path
export function extractFilePath(code: string, fullContent?: string): FilePathInfo {
  if (!fullContent) return {};
  const fullLines = fullContent.split('\n');
  const codeLines = code.split('\n');
  // 找到代码块在完整内容中的起始位置
  let codeStartIndex = -1;
  // 使用更精确的匹配策略：比较整个代码块内容
  for (let i = 0; i <= fullLines.length - codeLines.length; i++) {
    let match = true;
    // 比较所有行而不是只比较前几行
    for (let j = 0; j < codeLines.length; j++) {
      if (fullLines[i + j]?.trim() !== codeLines[j]?.trim()) {
        match = false;
        break;
      }
    }
    if (match) {
      codeStartIndex = i;
      break;
    }
  }
  if (codeStartIndex === -1) {
    // 如果完整匹配失败，尝试部分匹配作为备选方案
    for (let i = 0; i <= fullLines.length - codeLines.length; i++) {
      let match = true;
      // 比较前10行和后5行来提高匹配准确性
      const startLinesToCheck = Math.min(10, codeLines.length);
      const endLinesToCheck = Math.min(5, codeLines.length);
      // 检查开头几行
      for (let j = 0; j < startLinesToCheck; j++) {
        if (fullLines[i + j]?.trim() !== codeLines[j]?.trim()) {
          match = false;
          break;
        }
      }
      // 如果开头匹配，再检查结尾几行（如果代码块足够长）
      if (match && codeLines.length > startLinesToCheck) {
        const startOffset = codeLines.length - endLinesToCheck;
        for (let j = 0; j < endLinesToCheck; j++) {
          const fullLineIndex = i + startOffset + j;
          const codeLineIndex = startOffset + j;
          if (fullLines[fullLineIndex]?.trim() !== codeLines[codeLineIndex]?.trim()) {
            match = false;
            break;
          }
        }
      }
      if (match) {
        codeStartIndex = i;
        break;
      }
    }
  }
  if (codeStartIndex === -1) return {};
  // 从代码块位置向上查找最近的File Path:
  let nearestFilePathIndex = -1;
  for (let i = codeStartIndex - 1; i >= 0; i--) {
    const line = fullLines[i].trim();
    if (line.startsWith('File Path:') || line.startsWith('File:')) {
      nearestFilePathIndex = i;
      break; // 找到最近的就停止
    }
  }
  if (nearestFilePathIndex === -1) return {};
  const filePathLine = fullLines[nearestFilePathIndex].trim();
  // 支持 "File Path:" 和 "File:" 两种前缀
  const prefix = filePathLine.startsWith('File Path:') ? 'File Path:' : 'File:';
  const value = filePathLine.slice(prefix.length).trim();
  if (!value) return {};
  const sepIdx = Math.max(value.lastIndexOf('/'), value.lastIndexOf('\\'));
  if (sepIdx === -1) {
    // 只有文件名
    return { filePath: value, dirPath: undefined, fileName: value };
  }
  const dirPath = value.slice(0, sepIdx);
  const fileName = value.slice(sepIdx + 1);
  return { filePath: value, dirPath, fileName };
}
export function getLineNumbers(code: string) {
  const count = code.split('\n').length;
  return Array.from({ length: count }, (_, i) => i + 1);
}
// 检查代码块是否完整（基于成对的```标记）
export function isCodeBlockComplete(fullContent?: string, code?: string): boolean {
  if (!fullContent || !code) return false;
  const fullLines = fullContent.split('\n');
  const codeLines = code.split('\n');
  // 找到代码块在完整内容中的起始位置
  let codeStartIndex = -1;
  for (let i = 0; i <= fullLines.length - codeLines.length; i++) {
    let match = true;
    const linesToCheck = Math.min(3, codeLines.length);
    for (let j = 0; j < linesToCheck; j++) {
      if (fullLines[i + j]?.trim() !== codeLines[j]?.trim()) {
        match = false;
        break;
      }
    }
    if (match) {
      codeStartIndex = i;
      break;
    }
  }
  if (codeStartIndex === -1) return false;
  // 向上查找开始的```标记
  let startBacktickIndex = -1;
  for (let i = codeStartIndex - 1; i >= 0; i--) {
    const line = fullLines[i].trim();
    if (line.startsWith('```')) {
      startBacktickIndex = i;
      break;
    }
  }
  if (startBacktickIndex === -1) return false;
  // 向下查找结束的```标记
  let endBacktickIndex = -1;
  const codeEndIndex = codeStartIndex + codeLines.length - 1;
  for (let i = codeEndIndex + 1; i < fullLines.length; i++) {
    const line = fullLines[i].trim();
    if (line === '```') {
      endBacktickIndex = i;
      break;
    }
  }
  // 如果找到了成对的```标记，则认为代码块已完整
  return endBacktickIndex !== -1;
}