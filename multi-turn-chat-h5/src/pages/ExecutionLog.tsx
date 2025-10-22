import React, { useState } from 'react';
import { formatTime } from '../utils/format';
import type { ExecutionLog } from '../types';
import '../styles/ExecutionLog.css';

export const ExecutionLogPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'success' | 'warning' | 'error'>('all');
  const [logs] = useState<ExecutionLog[]>([
    {
      id: '1',
      type: 'success',
      message: '创建文件 src/components/ChatInput.tsx',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'warning',
      message: '文件已存在，跳过创建 src/utils/format.ts',
      timestamp: new Date().toISOString(),
    },
    {
      id: '3',
      type: 'error',
      message: '写入失败：权限不足 /root/protected.ts',
      timestamp: new Date().toISOString(),
    },
  ]);

  const filters = [
    { key: 'all' as const, label: '全部', count: logs.length },
    { key: 'success' as const, label: '成功', count: logs.filter(l => l.type === 'success').length },
    { key: 'warning' as const, label: '警告', count: logs.filter(l => l.type === 'warning').length },
    { key: 'error' as const, label: '错误', count: logs.filter(l => l.type === 'error').length },
  ];

  const filteredLogs = activeFilter === 'all' 
    ? logs 
    : logs.filter(log => log.type === activeFilter);

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="execution-log-page">
      <div className="filter-tabs">
        {filters.map((filter) => (
          <button
            key={filter.key}
            className={`filter-tab ${activeFilter === filter.key ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter.key)}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>

      <div className="log-summary">
        <div className="summary-title">📊 执行摘要</div>
        <div className="summary-stats">
          成功: {filters.find(f => f.key === 'success')?.count} | 
          失败: {filters.find(f => f.key === 'error')?.count} | 
          警告: {filters.find(f => f.key === 'warning')?.count}
        </div>
        <div className="summary-duration">总耗时: 2.3秒</div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <div className="empty-title">暂无执行日志</div>
          <div className="empty-description">
            开启自动更新代码后，执行日志将显示在这里
          </div>
        </div>
      ) : (
        <div className="log-list">
          {filteredLogs.map((log) => (
            <div key={log.id} className={`log-item log-${log.type}`}>
              <div className="log-header">
                <span className="log-icon">{getLogIcon(log.type)}</span>
                <span className="log-time">{formatTime(log.timestamp)}</span>
              </div>
              <div className="log-content">{log.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};