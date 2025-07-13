import React from 'react';
import { Message } from './types';
import './App.css';

interface ChatBoxProps {
  messages: Message[];
  onToggle: (index: number) => void;
  onCopy: (text: string) => void;
  onSave: (text: string) => void;
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages, onToggle, onCopy, onSave }) => {
  return (
    <div className="chat-box">
      {messages.map((msg, index) => (
        <div key={index} className={`chat-msg ${msg.role}`}>
          <div onClick={() => onToggle(index)} style={{ cursor: 'pointer' }}>
            <strong>
              {msg.role === 'user' ? '你' : msg.role === 'assistant' ? '助手' : '系统'}:
            </strong>
            <div className="content">
              {msg.collapsed
                ? msg.content.slice(0, 40).replace(/\n/g, ' ') + '...'
                : msg.content}
            </div>
          </div>
          <div className="actions">
            <button onClick={() => onCopy(msg.content)}>复制</button>
            <button onClick={() => onSave(msg.content)}>保存</button>
            <button disabled>发送到</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatBox;
