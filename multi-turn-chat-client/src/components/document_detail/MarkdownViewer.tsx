import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createMarkdownComponents } from './markdownComponents';
import './markdownComponents/inlineCodeFix.css';

interface MarkdownViewerProps {
  content: string;
  codeFontFamily: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, codeFontFamily }) => {
  const components = createMarkdownComponents(codeFontFamily);

  return (
    <div className="doc-md-root">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownViewer;