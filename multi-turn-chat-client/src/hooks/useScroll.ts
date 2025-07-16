// useScroll.ts
import { RefObject } from 'react';

export default function useScroll(chatBoxRef: RefObject<HTMLDivElement>) {
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
  return { scrollToBottom, scrollToTop };
}