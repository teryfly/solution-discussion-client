// ChatInput.tsx
import React from 'react';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  loading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ value, onChange, onSend, loading }) => {
  return (
    <div className="chat-controls">
      <textarea
        placeholder="输入你的消息..."
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        disabled={loading}
      />
      <button onClick={onSend} disabled={loading || !value.trim()}>
        {loading ? '发送中...' : '发送'}
      </button>
    </div>
  );
};

export default ChatInput;