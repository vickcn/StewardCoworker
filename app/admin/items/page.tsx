import Link from 'next/link';
import { getRequiredEnv } from '@/lib/utils/env';
import { readAllRows } from '@/lib/google/sheets';
import { mapRowToItem } from '@/lib/data/item-mapper';

export default async function AdminItemsPage() {
  const rows = await readAllRows(getRequiredEnv('SPREADSHEET_ID'));
  const items = rows.length ? rows.slice(1).filter((row) => row.length).map((row) => mapRowToItem(rows[0], row)) : [];
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <h2 className="text-lg font-semibold">所有項目</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl border border-stone-200 p-4">
            <div><div className="font-medium">{item.itemName}</div><div className="text-sm text-stone-500">{item.category}</div></div>
            <Link href={`/admin/items/${item.id}`} className="text-amber-700 underline">編輯</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
