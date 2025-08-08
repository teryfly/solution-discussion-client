import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        if (inline) {
          return <code className={className} {...props}>{children}</code>;
        }
        return (
          <CodeBlock
            language={match?.[1] || ''}
            code={String(children).replace(/\n$/, '')}
            fullContent={content} // 传递完整内容用于路径解析
          />
        );
      },
    }}
  >
    {content}
  </ReactMarkdown>
);

export default MarkdownRenderer;