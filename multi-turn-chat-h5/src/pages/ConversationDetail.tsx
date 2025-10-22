import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { conversationApi } from '../api/conversation';
import { sendMessageStream } from '../utils/sse';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { useToast } from '../hooks/useToast';
import type { Message, SSEMessage } from '../types';
import '../styles/ConversationDetail.css';

export const ConversationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sseClientRef = useRef<any>(null);

  useEffect(() => {
    if (id && id !== 'new') {
      loadMessages();
    } else {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await conversationApi.getMessages(id!);
      setMessages(data.messages);
    } catch (error: any) {
      showToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content: string) => {
    if (!id || id === 'new') {
      showToast({ message: '请先创建会话', type: 'error' });
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      conversation_id: id,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    const assistantMessage: Message = {
      id: Date.now() + 1,
      conversation_id: id,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setStreaming(true);

    let streamedContent = '';

    sseClientRef.current = sendMessageStream(
      id,
      {
        role: 'user',
        content,
        stream: true,
      },
      {
        onMessage: (data: SSEMessage) => {
          if (data.session_id) {
            setSessionId(data.session_id);
          }

          if (data.content) {
            streamedContent += data.content;
            setMessages((prev) => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg.role === 'assistant') {
                lastMsg.content = streamedContent;
              }
              return updated;
            });
          }
        },
        onError: (error) => {
          showToast({ message: error.message, type: 'error' });
          setStreaming(false);
        },
        onComplete: () => {
          setStreaming(false);
        },
      }
    );
  };

  const handleStopStream = async () => {
    if (sessionId) {
      try {
        await conversationApi.stopStream(sessionId);
        sseClientRef.current?.close();
        setStreaming(false);
      } catch (error: any) {
        showToast({ message: error.message, type: 'error' });
      }
    }
  };

  const handleCopyMessage = (message: Message) => {
    navigator.clipboard.writeText(message.content);
    showToast({ message: '已复制', type: 'success' });
  };

  const handleDeleteMessage = async (message: Message) => {
    try {
      await conversationApi.deleteMessages([message.id]);
      setMessages((prev) => prev.filter((m) => m.id !== message.id));
      showToast({ message: '已删除', type: 'success' });
    } catch (error: any) {
      showToast({ message: error.message, type: 'error' });
    }
  };

  return (
    <div className="conversation-detail-page">
      <div className="conversation-header">
        <button className="back-btn" onClick={() => navigate('/chat')}>
          ←
        </button>
        <h2>对话详情</h2>
        <div style={{ width: 32 }}></div>
      </div>

      <div className="messages-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner spinner-medium"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <div className="empty-title">开始对话</div>
            <div className="empty-description">输入消息开始与AI助手对话</div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onCopy={() => handleCopyMessage(message)}
                onDelete={() => handleDeleteMessage(message)}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {streaming && (
        <button className="stop-btn" onClick={handleStopStream}>
          ⏹ 停止生成
        </button>
      )}

      <ChatInput
        onSend={handleSendMessage}
        disabled={streaming}
        placeholder={streaming ? '正在生成中...' : '输入消息...'}
      />
    </div>
  );
};