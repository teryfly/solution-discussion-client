import React, { useEffect, useState } from 'react';
import {
  createConversation,
  sendMessage,
  getMessages,
  sendMessageStream
} from './api';
import './App.css';
import ConversationList from './ConversationList';

type Message = {
  role: string;
  content: string;
};

type ConversationMeta = {
  id: string;
  model: string;
  createdAt: string;
};

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant.';
const DEFAULT_MODEL = 'ChatGPT-4o-Latest';

const MODEL_OPTIONS = [
  'GPT-3.5-Turbo',
  'ChatGPT-4o-Latest',
  'Claude-3.5-Sonnet',
  'Gemini-1.5-Pro',
  'Mistral-7B-Instruct-v0.2',
];

function App() {
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [streamMode, setStreamMode] = useState(true);
  const [conversationList, setConversationList] = useState<ConversationMeta[]>([]);

  // 初始化加载
  useEffect(() => {
    const stored = localStorage.getItem('conversations');
    if (stored) {
      const list: ConversationMeta[] = JSON.parse(stored);
      setConversationList(list);

      if (list.length > 0) {
        const first = list[0];
        setConversationId(first.id);
        setModel(first.model);
        getMessages(first.id).then(setMessages);
      } else {
        handleNewConversation();
      }
    } else {
      handleNewConversation();
    }
  }, []);

  // 保存会话元数据
  const saveConversations = (list: ConversationMeta[]) => {
    localStorage.setItem('conversations', JSON.stringify(list));
    setConversationList(list);
  };

  const loadConversation = async (meta: ConversationMeta) => {
    setConversationId(meta.id);
    setModel(meta.model);
    const history = await getMessages(meta.id);
    setMessages(history);
  };

  const handleNewConversation = async () => {
    try {
      const id = await createConversation(DEFAULT_SYSTEM_PROMPT);

      const meta: ConversationMeta = {
        id,
        model,
        createdAt: new Date().toISOString(),
      };

      const newList = [meta, ...conversationList];
      saveConversations(newList);

      console.log('✅ 新会话已创建:', id);

      setConversationId(id);
      setModel(DEFAULT_MODEL);
      const history = await getMessages(id);
      setMessages(history);
    } catch (err) {
      console.error('❌ 创建新会话失败:', err);
    }
  };

  const handleSelectConversation = async (id: string) => {
    const found = conversationList.find(c => c.id === id);
    if (found) {
      await loadConversation(found);
    }
  };

  const fetchMessages = async (id: string) => {
    const history = await getMessages(id);
    setMessages(history);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    if (streamMode) {
      let streamedReply = '';
      const assistantMsg = { role: 'assistant', content: '' };
      setMessages((prev) => [...prev, assistantMsg]);

      sendMessageStream(
        conversationId,
        input,
        model,
        (chunk) => {
          streamedReply += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...assistantMsg, content: streamedReply };
            return updated;
          });
        },
        () => setLoading(false),
        (err) => {
          console.error('流式出错:', err);
          setLoading(false);
        }
      );
    } else {
      try {
        await sendMessage(conversationId, input, model);
        await fetchMessages(conversationId);
      } catch (err) {
        console.error('发送失败:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <ConversationList
        conversations={conversationList}
        activeId={conversationId}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
      />

      <div className="chat-container">
        <h2>🧠 多轮对话助手</h2>

        <div className="chat-toolbar">
          <label htmlFor="model-select">模型：</label>
          <select
            id="model-select"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {MODEL_OPTIONS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <label style={{ marginLeft: '20px' }}>
            <input
              type="checkbox"
              checked={streamMode}
              onChange={(e) => setStreamMode(e.target.checked)}
            />
            使用流式模式
          </label>
        </div>

        <div className="chat-box">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-msg ${msg.role}`}>
              <strong>{msg.role === 'user' ? '你' : msg.role === 'assistant' ? '助手' : '系统'}:</strong>
              <div>{msg.content}</div>
            </div>
          ))}
        </div>

        <div className="chat-controls">
          <textarea
            placeholder="输入你的消息..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          />
          <button onClick={handleSend} disabled={loading}>
            {loading ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
