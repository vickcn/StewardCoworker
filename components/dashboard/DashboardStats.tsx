import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/currency';

export function DashboardStats({ budgetTotal, actualTotal, variance }: { budgetTotal: number; actualTotal: number; variance: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card><div className="text-sm text-stone-500">預算總計</div><div className="mt-2 text-2xl font-semibold">{formatCurrency(budgetTotal)}</div></Card>
      <Card><div className="text-sm text-stone-500">實支總計</div><div className="mt-2 text-2xl font-semibold">{formatCurrency(actualTotal)}</div></Card>
      <Card><div className="text-sm text-stone-500">差額</div><div className="mt-2 text-2xl font-semibold">{formatCurrency(variance)}</div></Card>
    </div>
  );
}
