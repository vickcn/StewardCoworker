import type { ItemRecord } from '@/types/item';
export type SortKey = 'default' | 'budget' | 'variance';
export function filterAndSortItems(items: ItemRecord[], keyword: string, category: string, sortBy: SortKey) {
  let result = [...items];
  if (keyword.trim()) {
    const q = keyword.toLowerCase();
    result = result.filter((item) => item.itemName.toLowerCase().includes(q));
  }
  if (category && category !== '全部') result = result.filter((item) => item.category === category);
  if (sortBy === 'budget') result.sort((a, b) => b.budgetTotal - a.budgetTotal);
  if (sortBy === 'variance') result.sort((a, b) => b.variance - a.variance);
  return result;
}
