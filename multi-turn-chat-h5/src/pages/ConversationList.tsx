import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { conversationApi } from '../api/conversation';
import { useGlobalStore } from '../stores/globalStore';
import { useToast } from '../hooks/useToast';
import { formatTime } from '../utils/format';
import { NewConversationModal } from '../components/chat/NewConversationModal';
import type { Conversation } from '../types';
import '../styles/ConversationList.css';

export const ConversationList: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const navigate = useNavigate();
  const { currentProject } = useGlobalStore();
  const { showToast } = useToast();

  useEffect(() => {
    loadConversations();
  }, [currentProject]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await conversationApi.getConversations({
        project_id: currentProject?.id,
        status: 0,
      });
      setConversations(data);
    } catch (error: any) {
      showToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateConversation = async (data: {
    model: string;
    role: string;
    name?: string;
    systemPrompt?: string;
  }) => {
    try {
      const result = await conversationApi.createConversation({
        project_id: currentProject?.id || 0,
        model: data.model,
        assistance_role: data.role,
        name: data.name,
        system_prompt: data.systemPrompt || 'You are a helpful AI assistant.',
      });
      showToast({ message: '会话已创建', type: 'success' });
      setShowNewModal(false);
      navigate(`/chat/${result.conversation_id}`);
    } catch (error: any) {
      showToast({ message: error.message, type: 'error' });
    }
  };

  const handleConversationClick = (id: string) => {
    navigate(`/chat/${id}`);
  };

  return (
    <div className="conversation-list-page">
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 搜索会话..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner spinner-medium"></div>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <div className="empty-title">暂无会话</div>
          <div className="empty-description">
            {searchQuery ? '未找到匹配的会话' : '点击右下角按钮创建新会话'}
          </div>
        </div>
      ) : (
        <div className="conversation-list">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className="conversation-card"
              onClick={() => handleConversationClick(conv.id)}
            >
              <div className="conversation-header">
                <span className="conversation-icon">
                  {conv.assistance_role === 'product' ? '📋' : 
                   conv.assistance_role === 'architect' ? '🏗️' : 
                   conv.assistance_role === 'ba' ? '📊' : '💬'}
                </span>
                <span className="conversation-title">
                  {conv.name || '新会话'}
                </span>
              </div>
              <div className="conversation-meta">
                {currentProject && (
                  <span className="conversation-project">[{currentProject.name}]</span>
                )}
                <span className="conversation-time">
                  {formatTime(conv.updated_at || conv.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="fab" onClick={() => setShowNewModal(true)}>
        +
      </button>

      {showNewModal && (
        <NewConversationModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreateConversation}
        />
      )}
    </div>
  );
};