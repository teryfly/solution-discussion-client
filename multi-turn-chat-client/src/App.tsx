// ✅ 文件：App.tsx（配合右键菜单和新建弹窗）
import React, { useEffect, useRef, useState } from 'react';
import {
  createConversation,
  sendMessageStream,
  getMessages,
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
  const [conversationList, setConversationList] = useState<ConversationMeta[]>([]);

  const chatBoxRef = useRef<HTMLDivElement>(null);

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
      }
    }
  }, []);

  const saveConversations = (list: ConversationMeta[]) => {
    localStorage.setItem('conversations', JSON.stringify(list));
    setConversationList(list);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatBoxRef.current?.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }, 100);
  };

  const scrollToTop = () => {
    chatBoxRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadConversation = async (meta: ConversationMeta) => {
    setConversationId(meta.id);
    setModel(meta.model);
    setMessages([{ role: 'system', content: '加载中...', collapsed: false }]);
    const history = await getMessages(meta.id);
    const collapsedHistory = history.map((msg, idx) => {
      const tooLong = msg.content.length > 100;
      return {
        ...msg,
        collapsed: idx < history.length - 2 && tooLong,
      };
    });
    setMessages(collapsedHistory);
    scrollToBottom();
  };

  const handleNewConversation = async (options?: { name?: string; model: string; system?: string }) => {
    const systemPrompt = options?.system || DEFAULT_SYSTEM_PROMPT;
    const id = await createConversation(systemPrompt);
    const meta: ConversationMeta = {
      id,
      model: options?.model,
      name: options?.name,
      createdAt: new Date().toISOString(),
    };
    const newList = [meta, ...conversationList];
    saveConversations(newList);
    await loadConversation(meta);
  };

  const handleSelectConversation = async (id: string) => {
    const found = conversationList.find(c => c.id === id);
    if (found) await loadConversation(found);
  };

  const handleRenameConversation = (id: string, newName: string) => {
    const updated = conversationList.map(conv => conv.id === id ? { ...conv, name: newName } : conv);
    saveConversations(updated);
  };

  const handleDeleteConversation = (id: string) => {
    const updated = conversationList.filter(conv => conv.id !== id);
    saveConversations(updated);
    if (id === conversationId) {
      if (updated.length > 0) loadConversation(updated[0]);
      else setMessages([]);
    }
  };

  const handleModelChange = (id: string, newModel: string) => {
    const updated = conversationList.map(conv => conv.id === id ? { ...conv, model: newModel } : conv);
    saveConversations(updated);
    if (id === conversationId) {
      setModel(newModel);
    }
  };

  const collapsePrevious = () => {
    setMessages((prev) => {
      const newMessages = [...prev];
      if (newMessages.length >= 2) {
        newMessages[newMessages.length - 2].collapsed = true;
        newMessages[newMessages.length - 1].collapsed = true;
      }
      return newMessages;
    });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    collapsePrevious();

    const newUserMsg = { role: 'user', content: input, collapsed: false };
    const loadingMsg = { role: 'assistant', content: '⌛', collapsed: false };
    setMessages((prev) => [...prev, newUserMsg, loadingMsg]);
    setInput('');

    let streamedReply = '';
    sendMessageStream(
      conversationId,
      input,
      model,
      (chunk) => {
        streamedReply += chunk;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: streamedReply || '⌛',
            collapsed: false,
          };
          return updated;
        });
      },
      () => {
        setLoading(false);
        scrollToBottom();
      },
      (err) => {
        console.error('流式出错:', err);
        setLoading(false);
      }
    );
  };

  const toggleCollapse = (index: number) => {
    setMessages((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        collapsed: !updated[index].collapsed,
      };
      return updated;
    });
  };

  const handleCopy = (content: string) => navigator.clipboard.writeText(content);
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
    <div style={{ display: 'flex', flex: 1 }}>
      <ConversationList
        conversations={conversationList}
        activeId={conversationId}
        onSelect={handleSelectConversation}
        onNew={handleNewConversation}
        onRename={handleRenameConversation}
        onDelete={handleDeleteConversation}
        onModelChange={handleModelChange}
        modelOptions={modelOptions}
        model={model}
        onModelChangeGlobal={setModel} // 可选：若保留全局模型选择
      />

      <div className="chat-container" style={{ flex: 1 }}>
        <div className="chat-box-wrapper">
          <div className="scroll-arrow top" onClick={scrollToTop}>⬆</div>

          <div className="chat-box" ref={chatBoxRef}>
            <ChatBox
              messages={messages}
              onToggle={toggleCollapse}
              onCopy={handleCopy}
              onSave={handleSave}
            />
          </div>

          <div className="scroll-arrow bottom" onClick={scrollToBottom}>⬇</div>
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
