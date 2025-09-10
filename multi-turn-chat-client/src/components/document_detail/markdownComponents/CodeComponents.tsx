import React from 'react';

export const createCodeComponents = (codeFontFamily: string) => ({
  code({ node, inline, className, children, ...props }: any) {
    // Add a class to distinguish inline from block, but leave styling to CSS.
    const finalClassName = [
      inline ? 'inline-code' : 'block-code',
      className
    ].filter(Boolean).join(' ');

    return (
      <code className={finalClassName} style={{ fontFamily: codeFontFamily }} {...props}>
        {children}
      </code>
    );
  },

  pre({ children }: any) {
    // The 'pre' tag can keep its base styles as it's less likely to be globally overridden.
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
          textAlign: 'left',
          fontWeight: 'normal',
          whiteSpace: 'pre',
          display: 'block',
          width: 'auto',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </pre>
    );
  },
});