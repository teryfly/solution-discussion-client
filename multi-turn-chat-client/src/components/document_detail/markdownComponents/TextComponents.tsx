import React from 'react';

export const createTextComponents = () => ({
  p: ({ children }: any) => (
    <p>
      {children}
    </p>
  ),

  blockquote: ({ children }: any) => (
    <blockquote
      style={{
        borderLeft: '4px solid #dfe2e5',
        paddingLeft: '16px',
        margin: '16px 0',
        color: '#6a737d',
        fontStyle: 'italic',
        textAlign: 'left',
        fontSize: '1em',
        fontWeight: 'normal',
        lineHeight: '1.6',
        display: 'block',
        width: 'auto',
        maxWidth: '100%',
        boxSizing: 'border-box',
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere'
      }}
    >
      {children}
    </blockquote>
  ),

  strong: ({ children }: any) => (
    <strong style={{
      fontWeight: 'bold',
      textAlign: 'inherit',
      fontSize: 'inherit',
      lineHeight: 'inherit',
      color: 'inherit',
      display: 'inline',
    }}>
      {children}
    </strong>
  ),

  em: ({ children }: any) => (
    <em style={{
      fontStyle: 'italic',
      textAlign: 'inherit',
      fontSize: 'inherit',
      fontWeight: 'inherit',
      lineHeight: 'inherit',
      color: 'inherit',
      display: 'inline',
    }}>
      {children}
    </em>
  ),

  a: ({ children, href }: any) => (
    <a
      href={href}
      style={{
        color: '#1a73e8',
        textDecoration: 'underline',
        textAlign: 'inherit',
        fontSize: 'inherit',
        fontWeight: 'inherit',
        lineHeight: 'inherit',
        display: 'inline',
      }}
    >
      {children}
    </a>
  ),

  hr: () => (
    <hr style={{
      border: 'none',
      borderTop: '1px solid #ddd',
      margin: '24px 0',
      display: 'block',
      width: '100%',
      height: '1px',
      backgroundColor: 'transparent',
    }} />
  ),
});