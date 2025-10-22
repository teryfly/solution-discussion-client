export interface ParsedBlock {
  type: 'code' | 'plantuml' | 'markdown';
  language?: string;
  content: string;
  lineCount: number;
  title?: string;
  textAfter?: string;
}

export interface ParsedMessage {
  textBefore: string;
  blocks: ParsedBlock[];
  hasBlocks: boolean;
}

export const parseMessageContent = (content: string): ParsedMessage => {
  const blocks: ParsedBlock[] = [];
  let textBefore = '';

  // First, find all markdown blocks (they have priority and contain nested blocks)
  const mdBlockRegex = /```md\n([\s\S]*?)```/g;
  const mdMatches: Array<{ start: number; end: number; content: string; fullMatch: string }> = [];
  
  let mdMatch;
  while ((mdMatch = mdBlockRegex.exec(content)) !== null) {
    mdMatches.push({
      start: mdMatch.index,
      end: mdMatch.index + mdMatch[0].length,
      content: mdMatch[1],
      fullMatch: mdMatch[0],
    });
  }

  // If we have markdown blocks, process them and ignore nested content
  if (mdMatches.length > 0) {
    // Text before first markdown block
    textBefore = content.substring(0, mdMatches[0].start).trim();

    mdMatches.forEach((mdBlock, index) => {
      // Count total lines including nested code blocks
      const lineCount = mdBlock.content.split('\n').length;
      
      // Text after this block (before next block or end)
      const textAfter = index < mdMatches.length - 1
        ? content.substring(mdBlock.end, mdMatches[index + 1].start).trim()
        : content.substring(mdBlock.end).trim();

      blocks.push({
        type: 'markdown',
        language: 'md',
        content: mdBlock.content,
        lineCount,
        textAfter,
      });
    });

    return {
      textBefore,
      blocks,
      hasBlocks: true,
    };
  }

  // No markdown blocks, process regular code and PlantUML blocks
  const allMatches: Array<{
    type: 'code' | 'plantuml';
    index: number;
    length: number;
    language?: string;
    content: string;
    title?: string;
  }> = [];

  // Find all code blocks (excluding markdown)
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let codeMatch;
  
  while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
    const language = codeMatch[1] || 'text';
    const code = codeMatch[2];
    
    // Skip markdown blocks (already handled above)
    if (language === 'md') continue;

    allMatches.push({
      type: 'code',
      index: codeMatch.index,
      length: codeMatch[0].length,
      language,
      content: code,
    });
  }

  // Find all PlantUML blocks
  const plantUMLRegex = /@startuml\n([\s\S]*?)@enduml/g;
  let umlMatch;
  
  while ((umlMatch = plantUMLRegex.exec(content)) !== null) {
    const umlCode = umlMatch[1];
    const titleMatch = umlCode.match(/title\s+(.+)/);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    allMatches.push({
      type: 'plantuml',
      index: umlMatch.index,
      length: umlMatch[0].length,
      content: umlMatch[0],
      title,
    });
  }

  // Sort matches by index
  allMatches.sort((a, b) => a.index - b.index);

  if (allMatches.length === 0) {
    return {
      textBefore: content,
      blocks: [],
      hasBlocks: false,
    };
  }

  // Build blocks with text between them
  textBefore = content.substring(0, allMatches[0].index).trim();

  allMatches.forEach((match, index) => {
    const lineCount = match.content.split('\n').length;

    const textAfter = index < allMatches.length - 1
      ? content.substring(match.index + match.length, allMatches[index + 1].index).trim()
      : content.substring(match.index + match.length).trim();

    blocks.push({
      type: match.type,
      language: match.language,
      content: match.content,
      lineCount,
      title: match.title,
      textAfter,
    });
  });

  return {
    textBefore,
    blocks,
    hasBlocks: blocks.length > 0,
  };
};