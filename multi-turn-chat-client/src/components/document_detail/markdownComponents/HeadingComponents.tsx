import React from 'react';

const createHeadingStyle = (fontSize: string) => ({
  fontSize,
  fontWeight: 600,
  marginBottom: '0.5em',
  marginTop: '1em',
  // 重置外部样式
  textAlign: 'left' as const,
  lineHeight: '1.2',
  color: '#333',
  fontFamily: 'inherit',
  display: 'block' as const,
  width: 'auto',
});

export const createHeadingComponents = () => ({
  h1: ({ children }: any) => (
    <h1 style={createHeadingStyle('2em')}>
      {children}
    </h1>
  ),

  h2: ({ children }: any) => (
    <h2 style={createHeadingStyle('1.5em')}>
      {children}
    </h2>
  ),

  h3: ({ children }: any) => (
    <h3 style={createHeadingStyle('1.25em')}>
      {children}
    </h3>
  ),

  h4: ({ children }: any) => (
    <h4 style={createHeadingStyle('1.1em')}>
      {children}
    </h4>
  ),

  h5: ({ children }: any) => (
    <h5 style={createHeadingStyle('1em')}>
      {children}
    </h5>
  ),

  h6: ({ children }: any) => (
    <h6 style={createHeadingStyle('0.9em')}>
      {children}
    </h6>
  ),
});