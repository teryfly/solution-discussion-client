// ChatInput.tsx
import React, { useRef, useEffect } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  loading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ value, onChange, onSend, loading }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整高度
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [value]);

  // 在发送后重置高度
  const handleSend = () => {
    onSend(); // 触发外部逻辑

    // ✅ 重置高度
    if (textareaRef.current) {
      textareaRef.current.style.height = '60px';
    }
  };

  return (
    <div className="chat-controls">
      <textarea
        ref={textareaRef}
        placeholder="输入你的消息..."
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSend();
          }
        }}
        disabled={loading}
      />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <button
          onClick={handleSend}
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
