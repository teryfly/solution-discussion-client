import React, { useRef, useEffect, useState } from 'react';
import ChatBox from '../ChatBox';
import { Message, ConversationMeta } from '../types';

interface LogEntry {
  id: string;
  message: string;
  type: string;
  timestamp: string;
  data?: any;
}

interface ChatAreaProps {
  messages: Message[];
  currentMeta?: ConversationMeta;
  inputVisible: boolean;
  onToggle: (index: number) => void;
  onCopy: (text: string) => void;
  onSave: (text: string) => void;
  onRelayRole?: (role: string, content: string) => void;
  onInputValueChange?: (content: string) => void;
  setMessages?: (messages: Message[]) => void;
  onScrollToTop: () => void;
  onScrollToBottom: () => void;
  conversationId: string;
  executionLogs: LogEntry[];
  onClearExecutionLogs: () => void;
  onMessageComplete?: (content: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  currentMeta,
  inputVisible,
  onToggle,
  onCopy,
  onSave,
  onRelayRole,
  onInputValueChange,
  setMessages,
  onScrollToTop,
  onScrollToBottom,
  conversationId,
  executionLogs,
  onClearExecutionLogs,
  onMessageComplete,
}) => {
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [hasScrolledToLastMessage, setHasScrolledToLastMessage] = useState(false);

  // 监听消息变化，检测助手消息完成
  useEffect(() => {
    if (messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    // 检查是否是完成的助手消息（不包含等待动画）
    if (
      lastMessage &&
      lastMessage.role === 'assistant' &&
      typeof lastMessage.content === 'string' &&
      !lastMessage.content.includes('<span class="waiting-typing">') &&
      lastMessage.content.trim().length > 0
    ) {
      // 触发消息完成回调
      onMessageComplete?.(lastMessage.content);
    }
  }, [messages, onMessageComplete]);

  // 自动滚动逻辑
  useEffect(() => {
    if (!chatBoxRef.current) return;
    const lastMsg = messages[messages.length - 1];
    const shouldScroll =
      isAutoScroll &&
      lastMsg &&
      lastMsg.role === 'assistant' &&
      typeof lastMsg.content === 'string' &&
      !lastMsg.collapsed;
    if (shouldScroll) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isAutoScroll]);

  // 滚动监听
  useEffect(() => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatBox;
      if (scrollHeight - (scrollTop + clientHeight) < 2) {
        setIsAutoScroll(true);
      } else {
        setIsAutoScroll(false);
      }
    };
    chatBox.addEventListener('scroll', handleScroll);
    return () => {
      chatBox.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 页面加载完后自动滚动到最后一条消息首行并居中
  useEffect(() => {
    if (!chatBoxRef.current || messages.length === 0 || hasScrolledToLastMessage) return;
    // 等待DOM渲染完成
    setTimeout(() => {
      const chatBox = chatBoxRef.current;
      if (!chatBox) return;
      // 查找最后一条消息的DOM元素
      const msgNodes = chatBox.querySelectorAll('[data-message-id]');
      if (msgNodes.length === 0) return;
      const lastNode = msgNodes[msgNodes.length - 1] as HTMLElement;
      if (!lastNode) return;
      // 计算滚动位置，使最后一条消息的首行位于视口中央
      const chatBoxRect = chatBox.getBoundingClientRect();
      const lastNodeRect = lastNode.getBoundingClientRect();
      // 计算相对于chatBox的偏移量
      const offsetTop = lastNode.offsetTop;
      const viewportCenter = chatBox.clientHeight / 2;
      // 目标滚动位置：消息顶部 - 视口中心位置
      const targetScrollTop = offsetTop - viewportCenter + 20; // 20px微调
      chatBox.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });
      setHasScrolledToLastMessage(true);
    }, 100);
  }, [messages, conversationId, hasScrolledToLastMessage]);

  // 会话切换时重置滚动状态
  useEffect(() => {
    setHasScrolledToLastMessage(false);
  }, [conversationId]);

  // 发送消息后自动滚动到底部
  useEffect(() => {
    if (!chatBoxRef.current) return;
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'user') {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setIsAutoScroll(true);
    }
  }, [messages]);

  const handleScrollToTop = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    onScrollToTop();
  };

  const handleScrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setIsAutoScroll(true);
    }
    onScrollToBottom();
  };

  return (
    <div className="chat-box-wrapper" style={{
      position: 'relative',
      flex: 1,
      minHeight: 0,
      ...(inputVisible
        ? {}
        : {
            height: 'calc(100vh - 48px)',
            minHeight: 0,
            paddingBottom: 0,
          }),
    }}>
      <div className="scroll-arrow top" onClick={handleScrollToTop}>⬆</div>
      <div
        className="chat-box"
        ref={chatBoxRef}
        style={{
          overflowY: 'auto',
          height: '100%',
          minHeight: 0,
          ...(inputVisible ? {} : { minHeight: '0', height: '100%' }),
        }}
      >
        <ChatBox
          messages={messages}
          onToggle={onToggle}
          onCopy={onCopy}
          onSave={onSave}
          conversationMeta={{
            projectId: currentMeta?.projectId,
            name: currentMeta?.name,
          }}
          onRelayRole={onRelayRole}
          onInputValueChange={onInputValueChange}
          setMessages={setMessages}
        />
      </div>
      <div className="scroll-arrow bottom" onClick={handleScrollToBottom}>⬇</div>
    </div>
  );
};

export default ChatArea;