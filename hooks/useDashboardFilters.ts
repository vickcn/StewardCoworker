'use client';
import { useMemo, useState } from 'react';
import type { ItemRecord } from '@/types/item';
import { filterAndSortItems, type SortKey } from '@/lib/data/filters';
import { computeStats } from '@/lib/data/stats';

export function useDashboardFilters(items: ItemRecord[]) {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('全部');
  const [sortBy, setSortBy] = useState<SortKey>('default');
  const filteredItems = useMemo(() => filterAndSortItems(items, keyword, category, sortBy), [items, keyword, category, sortBy]);
  const stats = useMemo(() => computeStats(filteredItems), [filteredItems]);
  return { keyword, setKeyword, category, setCategory, sortBy, setSortBy, filteredItems, stats };
}
