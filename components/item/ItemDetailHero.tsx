import { Card } from '@/components/ui/Card';
import type { ItemRecord } from '@/types/item';

export function ItemDetailHero({ item }: { item: ItemRecord }) {
  return (
    <Card>
      <h1 className="text-2xl font-bold">{item.itemName}</h1>
      <p className="mt-2 text-stone-600">類別：{item.category}｜需求數量：{item.requiredQty}</p>
      <p className="mt-1 text-stone-600">認領狀態：{item.claimant || '尚未認領'}</p>
    </Card>
  );
}
