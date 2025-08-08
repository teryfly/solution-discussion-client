import { useState, useCallback } from 'react';

// key => animating 状态
export default function useCopyAnimMap() {
  const [copyAnimMap, setCopyAnimMap] = useState<{ [key: string]: boolean }>({});

  const triggerCopyAnim = useCallback((key: string) => {
    setCopyAnimMap(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopyAnimMap(prev => ({ ...prev, [key]: false }));
    }, 350);
  }, []);

  return { copyAnimMap, triggerCopyAnim };
}