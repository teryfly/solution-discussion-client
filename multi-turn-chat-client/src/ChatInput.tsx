// ChatInput.tsx
import React, { useRef } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  loading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ value, onChange, onSend, loading }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="chat-controls">
      <textarea
        ref={textareaRef}
        placeholder="输入你的消息..."
        value={value}
        onChange={e => onChange(e.target.value)}
        onInput={e => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = target.scrollHeight + 'px';
        }}
        onKeyDown={e => {
          // Ctrl+Enter发送，Enter仅换行
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            onSend();
          }
        }}
        disabled={loading}

      />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button
          onClick={onSend}
          disabled={loading || !value.trim()}
        >
          {loading ? '发送中...' : '发送'}
        </button>
        <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
          Ctrl+Enter 发送
        </div>
      </div>
    </div>
  );
};

export default ChatInput;