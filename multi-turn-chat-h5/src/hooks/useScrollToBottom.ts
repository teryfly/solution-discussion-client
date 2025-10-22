import { useEffect, useRef } from 'react';

export const useScrollToBottom = (dependencies: any[] = []) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, dependencies);

  return elementRef;
};