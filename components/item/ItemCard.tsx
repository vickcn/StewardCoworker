import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/currency';
import type { ItemRecord } from '@/types/item';

export function ItemCard({ item }: { item: ItemRecord }) {
  return (
    <Link href={`/items/${item.id}`}>
      <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
        <h3 className="text-lg font-semibold">{item.itemName}</h3>
        <p className="mt-1 text-sm text-stone-500">{item.category}・需求 {item.requiredQty}</p>
        <div className="mt-4 space-y-1 text-sm">
          <div>預算總額：{formatCurrency(item.budgetTotal)}</div>
          <div>實支總額：{formatCurrency(item.actualTotal)}</div>
          <div>認領人：{item.claimant || '尚未認領'}</div>
        </div>
      </Card>
    </Link>
  );
}
