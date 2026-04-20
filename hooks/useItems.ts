'use client';
import { useEffect, useState } from 'react';
import type { ItemRecord } from '@/types/item';
export function useItems() {
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    fetch('/api/items')
      .then((res) => res.json())
      .then((data) => { if (mounted) setItems(data.items ?? []); })
      .catch(() => { if (mounted) setError('資料載入失敗'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);
  return { items, loading, error };
}
