import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownViewerProps {
  content: string;
  codeFontFamily: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, codeFontFamily }) => {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            return (
              <code
                className={className}
                style={{
                  backgroundColor: inline ? '#f1f3f4' : '#fafafa',
                  border: inline ? '1px solid #ddd' : '1px solid #eee',
                  padding: inline ? '2px 4px' : '10px 12px',
                  borderRadius: inline ? '3px' : '6px',
                  fontSize: inline ? '0.9em' : '1em',
                  fontFamily: codeFontFamily,
                  display: inline ? 'inline' : 'block',
                  whiteSpace: 'pre',
                  overflowX: 'auto',
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre({ children }) {
            return (
              <pre
                style={{
                  background: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: 6,
                  padding: 12,
                  overflow: 'auto',
                  fontFamily: codeFontFamily,
                  fontSize: 12,
                  lineHeight: 1.4,
                  margin: '16px 0',
                }}
              >
                {children}
              </pre>
            );
          },
          h1: ({ children }) => (
            <h1 style={{ fontSize: '2em', fontWeight: 600, marginBottom: '0.5em', marginTop: '1em' }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 style={{ fontSize: '1.5em', fontWeight: 600, marginBottom: '0.5em', marginTop: '1em' }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 style={{ fontSize: '1.25em', fontWeight: 600, marginBottom: '0.5em', marginTop: '1em' }}>
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p style={{ marginBottom: '1em', lineHeight: 1.6 }}>
              {children}
            </p>
          ),
          blockquote: ({ children }) => (
            <blockquote
              style={{
                borderLeft: '4px solid #dfe2e5',
                paddingLeft: '16px',
                margin: '16px 0',
                color: '#6a737d',
                fontStyle: 'italic',
              }}
            >
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul style={{ paddingLeft: '2em', marginBottom: '1em' }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol style={{ paddingLeft: '2em', marginBottom: '1em' }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li style={{ marginBottom: '0.25em' }}>
              {children}
            </li>
          ),
          table: ({ children }) => (
            <table
              style={{
                borderCollapse: 'collapse',
                width: '100%',
                margin: '16px 0',
                border: '1px solid #ddd',
              }}
            >
              {children}
            </table>
          ),
          th: ({ children }) => (
            <th
              style={{
                border: '1px solid #ddd',
                padding: '8px 12px',
                backgroundColor: '#f5f5f5',
                fontWeight: 600,
                textAlign: 'left',
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              style={{
                border: '1px solid #ddd',
                padding: '8px 12px',
              }}
            >
              {children}
            </td>
          ),
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownViewer;