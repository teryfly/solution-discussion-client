import React from 'react';

const listBaseStyle = {
  paddingLeft: '2em',
  marginBottom: '1em',
  // 重置外部样式
  textAlign: 'left' as const,
  fontSize: '1em',
  fontWeight: 'normal',
  lineHeight: '1.6',
  display: 'block' as const,
  width: 'auto',
  margin: '0 0 1em 0',
};

export const createListComponents = () => ({
  ul: ({ children }: any) => (
    <ul style={{
      ...listBaseStyle,
      listStyleType: 'disc',
    }}>
      {children}
    </ul>
  ),

  ol: ({ children }: any) => (
    <ol style={{
      ...listBaseStyle,
      listStyleType: 'decimal',
    }}>
      {children}
    </ol>
  ),

  li: ({ children }: any) => (
    <li style={{
      marginBottom: '0.25em',
      // 重置外部样式
      textAlign: 'left',
      fontSize: '1em',
      fontWeight: 'normal',
      lineHeight: '1.6',
      display: 'list-item',
      width: 'auto',
    }}>
      {children}
    </li>
  ),
});