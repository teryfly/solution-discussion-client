// hooks/usePlanCategories.ts
import { useEffect, useState } from 'react';
import { getPlanCategories } from '../api';

export type PlanCategory = { id: number; name: string };

export default function usePlanCategories() {
  const [categories, setCategories] = useState<PlanCategory[]>([]);

  useEffect(() => {
    let mounted = true;
    // 优先本地
    const cache = localStorage.getItem('plan_categories');
    if (cache) {
      try {
        setCategories(JSON.parse(cache));
      } catch (e) {}
    }
    // 始终后台刷新
    getPlanCategories().then(list => {
      if (mounted) setCategories(list);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // 手动刷新
  const refresh = async () => {
    const list = await getPlanCategories();
    setCategories(list);
    return list;
  };

  return { categories, refresh };
}