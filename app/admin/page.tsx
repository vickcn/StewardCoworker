import Link from 'next/link';
import { getRequiredEnv } from '@/lib/utils/env';
import { readAllRows } from '@/lib/google/sheets';
import { mapRowToItem } from '@/lib/data/item-mapper';
import { computeStats } from '@/lib/data/stats';
import { DashboardStats } from '@/components/dashboard/DashboardStats';

export default async function AdminPage() {
  const rows = await readAllRows(getRequiredEnv('SPREADSHEET_ID'));
  const items = rows.length ? rows.slice(1).filter((row) => row.length).map((row) => mapRowToItem(rows[0], row)) : [];
  const stats = computeStats(items);
  return (
    <main className="space-y-6">
      <DashboardStats {...stats} />
      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <Link href="/admin/items" className="text-amber-700 underline">前往項目列表</Link>
      </div>
    </main>
  );
}
