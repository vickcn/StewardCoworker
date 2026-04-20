import { NextResponse } from 'next/server';
import { getRequiredEnv } from '@/lib/utils/env';
import { readAllRows } from '@/lib/google/sheets';
import { mapRowToItem } from '@/lib/data/item-mapper';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await readAllRows(getRequiredEnv('SPREADSHEET_ID'));
    if (!rows.length) return NextResponse.json({ error: '找不到資料' }, { status: 404 });
    const [headers, ...dataRows] = rows;
    const row = dataRows.find((r) => r[headers.indexOf('ID')] === id);
    if (!row) return NextResponse.json({ error: '找不到品項' }, { status: 404 });
    return NextResponse.json({ item: mapRowToItem(headers, row) });
  } catch {
    return NextResponse.json({ error: '讀取失敗' }, { status: 500 });
  }
}
