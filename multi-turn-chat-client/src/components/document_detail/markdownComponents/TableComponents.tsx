import React from 'react';

const cellBaseStyle = {
  border: '1px solid #ddd',
  padding: '8px 12px',
  // 重置外部样式
  textAlign: 'left' as const,
  fontSize: '1em',
  lineHeight: '1.6',
  display: 'table-cell' as const,
  verticalAlign: 'top' as const,
};

export const createTableComponents = () => ({
  table: ({ children }: any) => (
    <table
      style={{
        borderCollapse: 'collapse',
        width: '100%',
        margin: '16px 0',
        border: '1px solid #ddd',
        // 重置外部样式
        textAlign: 'left',
        fontSize: '1em',
        fontWeight: 'normal',
        lineHeight: '1.6',
        display: 'table',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </table>
  ),

  th: ({ children }: any) => (
    <th
      style={{
        ...cellBaseStyle,
        backgroundColor: '#f5f5f5',
        fontWeight: 600,
      }}
    >
      {children}
    </th>
  ),

  td: ({ children }: any) => (
    <td style={cellBaseStyle}>
      {children}
    </td>
  ),
});