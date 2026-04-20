import type { ItemRecord } from '@/types/item';
export function computeStats(items: ItemRecord[]) {
  return items.reduce((acc, item) => {
    acc.budgetTotal += item.budgetTotal;
    acc.actualTotal += item.actualTotal;
    acc.variance += item.variance;
    return acc;
  }, { budgetTotal: 0, actualTotal: 0, variance: 0 });
}
