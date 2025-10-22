import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileCard } from '../components/chat/FileCard';
import { CodeDrawer } from '../components/chat/CodeDrawer';
import { PlantUMLDrawer } from '../components/chat/PlantUMLDrawer';
import { parseMessageContent } from '../utils/messageParser';
import type { ParsedBlock } from '../utils/messageParser';
import '../styles/MarkdownPreview.css';

export const MarkdownPreview: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { content } = location.state || { content: '' };
  
  const [selectedBlock, setSelectedBlock] = useState<ParsedBlock | null>(null);

  const parsed = parseMessageContent(content);

  const handleBlockClick = (block: ParsedBlock) => {
    setSelectedBlock(block);
  };

  const renderContent = () => {
    if (parsed.blocks.length === 0) {
      return (
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      );
    }

    return (
      <div className="markdown-with-blocks">
        {parsed.textBefore && (
          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {parsed.textBefore}
            </ReactMarkdown>
          </div>
        )}
        
        {parsed.blocks.map((block, index) => (
          <React.Fragment key={index}>
            <FileCard
              type={block.type === 'plantuml' ? 'uml' : block.type === 'markdown' ? 'markdown' : 'code'}
              language={block.language}
              lineCount={block.lineCount}
              title={block.title}
              onClick={() => handleBlockClick(block)}
            />
            {block.textAfter && (
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {block.textAfter}
                </ReactMarkdown>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="markdown-preview-page">
      <div className="preview-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ←
        </button>
        <h2>Markdown 预览</h2>
        <div style={{ width: 32 }}></div>
      </div>

      <div className="preview-content">
        {renderContent()}
      </div>

      {selectedBlock && selectedBlock.type === 'plantuml' && (
        <PlantUMLDrawer
          code={selectedBlock.content}
          title={selectedBlock.title}
          onClose={() => setSelectedBlock(null)}
        />
      )}

      {selectedBlock && selectedBlock.type === 'code' && (
        <CodeDrawer
          code={selectedBlock.content}
          language={selectedBlock.language || 'text'}
          onClose={() => setSelectedBlock(null)}
        />
      )}

      {selectedBlock && selectedBlock.type === 'markdown' && (
        <CodeDrawer
          code={selectedBlock.content}
          language="markdown"
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  );
};