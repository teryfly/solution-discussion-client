// PlantUML片段检测和提取工具
export interface PlantUMLSegment {
  type: 'text' | 'plantuml';
  content: string;
  startIndex: number;
  endIndex: number;
}

/**
 * 检测文本中是否包含PlantUML代码块
 */
export function containsPlantUML(text: string): boolean {
  return text.includes('@startuml') && text.includes('@enduml');
}

/**
 * 将包含PlantUML的文本分割为文本和PlantUML片段
 */
export function parseTextWithPlantUML(text: string): PlantUMLSegment[] {
  const segments: PlantUMLSegment[] = [];
  let currentIndex = 0;
  
  while (currentIndex < text.length) {
    const startMatch = text.indexOf('@startuml', currentIndex);
    
    if (startMatch === -1) {
      // 没有更多PlantUML，剩余部分作为文本
      if (currentIndex < text.length) {
        segments.push({
          type: 'text',
          content: text.slice(currentIndex),
          startIndex: currentIndex,
          endIndex: text.length
        });
      }
      break;
    }
    
    // 添加PlantUML前的文本部分
    if (startMatch > currentIndex) {
      segments.push({
        type: 'text',
        content: text.slice(currentIndex, startMatch),
        startIndex: currentIndex,
        endIndex: startMatch
      });
    }
    
    // 查找对应的@enduml
    const endMatch = text.indexOf('@enduml', startMatch);
    if (endMatch === -1) {
      // 没有找到结束标记，剩余部分作为文本处理
      segments.push({
        type: 'text',
        content: text.slice(startMatch),
        startIndex: startMatch,
        endIndex: text.length
      });
      break;
    }
    
    // 找到完整的PlantUML块
    const endIndex = endMatch + '@enduml'.length;
    segments.push({
      type: 'plantuml',
      content: text.slice(startMatch, endIndex),
      startIndex: startMatch,
      endIndex: endIndex
    });
    
    currentIndex = endIndex;
  }
  
  return segments;
}

/**
 * 提取文本中的所有PlantUML代码块
 */
export function extractPlantUMLBlocks(text: string): string[] {
  const blocks: string[] = [];
  const segments = parseTextWithPlantUML(text);
  
  segments.forEach(segment => {
    if (segment.type === 'plantuml') {
      blocks.push(segment.content);
    }
  });
  
  return blocks;
}

/**
 * 检查PlantUML代码块是否完整（有开始和结束标记）
 */
export function isPlantUMLComplete(umlCode: string): boolean {
  return umlCode.includes('@startuml') && umlCode.includes('@enduml');
}

/**
 * 清理PlantUML代码（移除多余的空行和格式化）
 */
export function cleanPlantUMLCode(umlCode: string): string {
  return umlCode
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

/**
 * 从PlantUML代码中提取title
 */
export function extractPlantUMLTitle(umlCode: string): string {
  const lines = umlCode.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // 支持多种title格式
    if (trimmed.startsWith('title ')) {
      return trimmed.substring(6).trim();
    }
    if (trimmed.startsWith('!define TITLE ')) {
      return trimmed.substring(14).trim();
    }
    // 支持带引号的title
    const titleMatch = trimmed.match(/^title\s+"([^"]+)"/i);
    if (titleMatch) {
      return titleMatch[1];
    }
  }
  return 'PlantUML图表';
}

/**
 * 检测PlantUML代码的类型（时序图、类图等）
 */
export function detectPlantUMLType(umlCode: string): string {
  const lowerCode = umlCode.toLowerCase();
  
  if (lowerCode.includes('participant') || lowerCode.includes('actor') || lowerCode.includes('->')) {
    return '时序图';
  }
  if (lowerCode.includes('class ') || lowerCode.includes('interface ')) {
    return '类图';
  }
  if (lowerCode.includes('usecase') || lowerCode.includes('actor')) {
    return '用例图';
  }
  if (lowerCode.includes('state ') || lowerCode.includes('[*]')) {
    return '状态图';
  }
  if (lowerCode.includes('component') || lowerCode.includes('package')) {
    return '组件图';
  }
  if (lowerCode.includes('node ') || lowerCode.includes('cloud ')) {
    return '部署图';
  }
  if (lowerCode.includes('activity')) {
    return '活动图';
  }
  
  return 'PlantUML图表';
}