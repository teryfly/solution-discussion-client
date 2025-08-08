import { FilePathInfo } from './types';

// 从完整内容中查找当前代码块对应的File Path
export function extractFilePath(code: string, fullContent?: string): FilePathInfo {
  if (!fullContent) return {};
  
  const fullLines = fullContent.split('\n');
  const codeLines = code.split('\n');
  
  // 找到代码块在完整内容中的起始位置
  let codeStartIndex = -1;
  for (let i = 0; i <= fullLines.length - codeLines.length; i++) {
    let match = true;
    for (let j = 0; j < Math.min(3, codeLines.length); j++) {
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
  
  if (codeStartIndex === -1) return {};
  
  // 从代码块位置向上查找File Path:
  for (let i = codeStartIndex - 1; i >= 0; i--) {
    const line = fullLines[i].trim();
    if (line.startsWith('File Path:')) {
      const value = line.slice('File Path:'.length).trim();
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
  }
  
  return {};
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
    for (let j = 0; j < Math.min(3, codeLines.length); j++) {
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