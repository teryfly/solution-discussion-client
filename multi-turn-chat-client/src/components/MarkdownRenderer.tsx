import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';
// 过滤掉所有空行
function removeBlankLines(text: string): string {
  return text
    .split('\n')
    .filter(line => line.trim() !== '')
    .join('\n');
}
// 检测原始代码是否来自 ``` 三反引号块
function isTripleBacktickBlock(node: any, content: string): boolean {
  if (!node?.position || !content) return false;
  const startOffset = node.position.start.offset;
  const endOffset = node.position.end.offset;
  if (typeof startOffset !== 'number' || typeof endOffset !== 'number') {
    return false;
  }
  const rawSnippet = content.slice(startOffset, endOffset);
  return rawSnippet.trim().startsWith('```');
}
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const noBlankContent = removeBlankLines(content);
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // 行内代码与代码块
        code({ node, inline, className, children, ...props }) {
          if (isTripleBacktickBlock(node, noBlankContent)) {
            const match = /language-(\w+)/.exec(className || '');
            return (
              <CodeBlock
                language={match?.[1] || ''}
                code={String(children).replace(/\n$/, '')}
                fullContent={noBlankContent}
              />
            );
          }
          return (
            <code
              className={className}
              style={{
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                padding: '2px 4px',
                borderRadius: '3px',
                fontSize: '0.9em',
                fontFamily: 'monospace',
                //color: '#d6336c'
              }}
              {...props}
            >
              {children}
            </code>
          );
        },
        // 统一重置标题样式
        h1: ({ children }) => <div style={{ fontSize: '1em', fontWeight: 500, margin: 0 }}>{children}</div>,
        h2: ({ children }) => <div style={{ fontSize: '1em', fontWeight: 500, margin: 0 }}>{children}</div>,
        h3: ({ children }) => <div style={{ fontSize: '1em', fontWeight: 500, margin: 0 }}>{children}</div>,
        h4: ({ children }) => <div style={{ fontSize: '1em', fontWeight: 500, margin: 0 }}>{children}</div>,
        h5: ({ children }) => <div style={{ fontSize: '1em', fontWeight: 500, margin: 0 }}>{children}</div>,
        h6: ({ children }) => <div style={{ fontSize: '1em', fontWeight: 500, margin: 0 }}>{children}</div>,
        p: ({ children }) => <p style={{ margin: 0, fontSize: '1em', fontWeight: 400 }}>{children}</p>,
      }}
    >
      {noBlankContent}
    </ReactMarkdown>
  );
};
export default MarkdownRenderer;