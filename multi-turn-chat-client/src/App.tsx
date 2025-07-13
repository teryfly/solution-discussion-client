import React, { useEffect, useState } from 'react';
import {
  createConversation,
  sendMessage,
  getMessages,
  sendMessageStream,
  getModels,
} from './api';
import './App.css';
import ConversationList from './ConversationList';
import ChatBox from './ChatBox';
import { Message, ConversationMeta } from './types';

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant.';

function App() {
  const [conversationId, setConversationId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('');
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [streamMode, setStreamMode] = useState(true);
  const [conversationList, setConversationList] = useState<ConversationMeta[]>([]);

  useEffect(() => {
    getModels().then(setModelOptions);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('conversations');
    if (stored) {
      const list: ConversationMeta[] = JSON.parse(stored);
      setConversationList(list);
      if (list.length > 0) {
        loadConversation(list[0]);
      } else {
        handleNewConversation();
      }
    } else {
      handleNewConversation();
    }
  }, []);

  const saveConversations = (list: ConversationMeta[]) => {
    localStorage.setItem('conversations', JSON.stringify(list));
    setConversationList(list);
  };

  const loadConversation = async (meta: ConversationMeta) => {
    setConversationId(meta.id);
    setModel(meta.model);
    const history = await getMessages(meta.id);
    setMessages(history.map(msg => ({ ...msg, collapsed: false })));
  };

  const handleNewConversation = async () => {
    const id = await createConversation(DEFAULT_SYSTEM_PROMPT);
    const meta: ConversationMeta = {
      id,
      model: model || 'ChatGPT-4o-Latest',
      createdAt: new Date().toISOString(),
    };
    const newList = [meta, ...conversationList];
    saveConversations(newList);
    await loadConversation(meta);
  };

  const handleSelectConversation = async (id: string) => {
    const found = conversationList.find(c => c.id === id);
    if (found) {
      await loadConversation(found);
    }
  };

  const collapsePrevious = () => {
    setMessages((prev) =>
      prev.map((m, i) => (i >= prev.length - 2 ? m : { ...m, collapsed: true }))
    );
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    collapsePrevious();

    const newMessages = [...messages, { role: 'user', content: input, collapsed: false }];
    setMessages(newMessages);
    setInput('');

    if (streamMode) {
      let streamedReply = '';
      const assistantMsg = { role: 'assistant', content: '', collapsed: false };
      setMessages((prev) => [...prev, assistantMsg]);

      sendMessageStream(
        conversationId,
        input,
        model,
        (chunk) => {
          streamedReply += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...assistantMsg,
              content: streamedReply,
              collapsed: false,
            };
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
        const history = await getMessages(conversationId);
        setMessages(history.map(msg => ({ ...msg, collapsed: false })));
      } catch (err) {
        console.error('发送失败:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleCollapse = (index: number) => {
    setMessages((prev) => {
      const updated = [...prev];
      updated[index].collapsed = !updated[index].collapsed;
      return updated;
    });
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleSave = (content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'message.txt';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
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
            {modelOptions.map((m) => (
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

        <ChatBox
          messages={messages}
          onToggle={toggleCollapse}
          onCopy={handleCopy}
          onSave={handleSave}
        />

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
