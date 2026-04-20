import { NextResponse } from 'next/server';
import { getRequiredEnv } from '@/lib/utils/env';
import { readAllRows } from '@/lib/google/sheets';
import { mapRowToItem } from '@/lib/data/item-mapper';
import { appConfig } from '@/config/app.config';

export const revalidate = appConfig.revalidateSeconds;

export async function GET() {
  try {
    const rows = await readAllRows(getRequiredEnv('SPREADSHEET_ID'));
    if (!rows.length) return NextResponse.json({ items: [] });
    const [headers, ...dataRows] = rows;
    const items = dataRows.filter((row) => row.length > 0).map((row) => mapRowToItem(headers, row));
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: '讀取項目失敗' }, { status: 500 });
  }
}
