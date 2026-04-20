import { notFound } from 'next/navigation';
import { getRequiredEnv } from '@/lib/utils/env';
import { readAllRows } from '@/lib/google/sheets';
import { mapRowToItem } from '@/lib/data/item-mapper';
import { AdminActionBar } from '@/components/admin/AdminActionBar';
import { AdminItemEditor } from '@/components/admin/AdminItemEditor';
import { AdminJsonEditor } from '@/components/admin/AdminJsonEditor';

export default async function AdminItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await readAllRows(getRequiredEnv('SPREADSHEET_ID'));
  if (!rows.length) return notFound();
  const [headers, ...dataRows] = rows;
  const row = dataRows.find((r) => r[headers.indexOf('ID')] === id);
  if (!row) return notFound();
  const item = mapRowToItem(headers, row);
  const interactiveJson = row[headers.indexOf('互動資料 (JSON)')] ?? '{}';
  return (
    <main className="space-y-6">
      <AdminActionBar />
      <AdminItemEditor item={item} />
      <AdminJsonEditor itemId={item.id} initialJson={interactiveJson} />
    </main>
  );
}
