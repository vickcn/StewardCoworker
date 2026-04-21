import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/currency';
import type { ItemRecord } from '@/types/item';

interface Props {
  items: ItemRecord[];
  projectId: string;
}

export function ItemTable({ items, projectId }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-3">品項</th>
            <th className="px-4 py-3">類別</th>
            <th className="px-4 py-3">需求</th>
            <th className="px-4 py-3">預算總額</th>
            <th className="px-4 py-3">實支總額</th>
            <th className="px-4 py-3">認領人</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-gray-100">
              <td className="px-4 py-3">
                <Link href={`/projects/${projectId}/items/${item.id}`} className="underline hover:text-blue-600">
                  {item.itemName}
                </Link>
              </td>
              <td className="px-4 py-3">{item.category}</td>
              <td className="px-4 py-3">{item.requiredQty}</td>
              <td className="px-4 py-3">{formatCurrency(item.budgetTotal)}</td>
              <td className="px-4 py-3">{formatCurrency(item.actualTotal)}</td>
              <td className="px-4 py-3">{item.claimant || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
