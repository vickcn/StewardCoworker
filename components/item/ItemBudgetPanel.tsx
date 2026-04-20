import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/currency';
import type { ItemRecord } from '@/types/item';

export function ItemBudgetPanel({ item }: { item: ItemRecord }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card><div className="text-sm text-stone-500">預算單價</div><div className="mt-2 text-xl font-semibold">{formatCurrency(item.budgetUnitPrice)}</div></Card>
      <Card><div className="text-sm text-stone-500">實際買價</div><div className="mt-2 text-xl font-semibold">{formatCurrency(item.actualUnitPrice ?? 0)}</div></Card>
      <Card><div className="text-sm text-stone-500">差額</div><div className="mt-2 text-xl font-semibold">{formatCurrency(item.variance)}</div></Card>
    </div>
  );
}
