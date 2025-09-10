export type DocumentFormat = 'plantuml' | 'markdown' | 'text';

export function detectDocumentFormat(filename?: string, content?: string): DocumentFormat {
  const c = (content || '').trim();
  const f = (filename || '').toLowerCase();

  // Priority 1: PlantUML by filename extension
  if (f.endsWith('.puml') || f.endsWith('.plantuml') || f.endsWith('.uml')) {
    return 'plantuml';
  }

  // Priority 2: PlantUML by content markers
  if (c.includes('@startuml') && c.includes('@enduml')) {
    return 'plantuml';
  }

  // Additional PlantUML markers
  if (c.includes('@startmindmap') && c.includes('@endmindmap')) {
    return 'plantuml';
  }
  if (c.includes('@startsalt') && c.includes('@endsalt')) {
    return 'plantuml';
  }
  if (c.includes('@startgantt') && c.includes('@endgantt')) {
    return 'plantuml';
  }

  // Priority 3: Markdown by filename extension
  if (f.endsWith('.md') || f.endsWith('.markdown') || f.endsWith('.mdown')) {
    return 'markdown';
  }

  // Priority 4: Markdown by content heuristics
  const hasMarkdownHeadings = /^#{1,6}\s/m.test(c);
  const hasMarkdownLists = /^(\*|-|\+)\s+/m.test(c) || /^\d+\.\s+/m.test(c);
  const hasCodeFences = /```/.test(c);
  const hasMarkdownLinks = /\[.+\]\(.+\)/.test(c);
  const hasMarkdownEmphasis = /(\*\*|__).+(\*\*|__)/.test(c) || /(\*|_).+(\*|_)/.test(c);
  const hasMarkdownTables = /\|.+\|/.test(c);

  const markdownScore = [
    hasMarkdownHeadings,
    hasMarkdownLists,
    hasCodeFences,
    hasMarkdownLinks,
    hasMarkdownEmphasis,
    hasMarkdownTables
  ].filter(Boolean).length;

  // If 2 or more markdown features detected, consider it markdown
  if (markdownScore >= 2) {
    return 'markdown';
  }

  // Default to plain text
  return 'text';
}