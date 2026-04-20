import { getRequiredEnv } from '@/lib/utils/env';
import { readAllRows } from '@/lib/google/sheets';
import { mapRowToItem } from '@/lib/data/item-mapper';
import { computeStats } from '@/lib/data/stats';
import { ok, fail } from '@/lib/utils/response';

export async function GET() {
  try {
    const rows = await readAllRows(getRequiredEnv('SPREADSHEET_ID'));
    const items = rows.length ? rows.slice(1).filter((row) => row.length).map((row) => mapRowToItem(rows[0], row)) : [];
    return ok(computeStats(items));
  } catch (error) {
    return fail('統計失敗', 500, error instanceof Error ? error.message : undefined);
  }
}
