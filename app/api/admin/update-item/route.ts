import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getRequiredEnv } from '@/lib/utils/env';
import { readAllRows, getRowById, updateRange, findHeaderIndex, columnLetter } from '@/lib/google/sheets';
import { SHEET_COLUMNS, SHEET_NAME } from '@/lib/constants/sheet';
import { fail, ok } from '@/lib/utils/response';
import { revalidateItemPaths } from '@/lib/cache/revalidate';
import { auth } from '@/lib/auth/auth';

const schema = z.object({
  itemId: z.string(),
  itemName: z.string().optional(),
  claimant: z.string().optional(),
  interactiveJson: z.string().optional(),
});


export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return fail('未授權', 401);

    const body = schema.parse(await req.json());
    const spreadsheetId = getRequiredEnv('SPREADSHEET_ID');
    const rows = await readAllRows(spreadsheetId);
    const found = getRowById(rows, body.itemId);
    if (!found) return fail('找不到品項', 404);
    const { headers, rowNumber } = found;
    const updates: Promise<unknown>[] = [];
    if (typeof body.itemName === 'string') {
      const idx = findHeaderIndex(headers, SHEET_COLUMNS.ITEM_NAME);
      updates.push(updateRange(spreadsheetId, `${SHEET_NAME}!${columnLetter(idx)}${rowNumber}`, [[body.itemName]]));
    }
    if (typeof body.claimant === 'string') {
      const idx = findHeaderIndex(headers, SHEET_COLUMNS.CLAIMANT);
      updates.push(updateRange(spreadsheetId, `${SHEET_NAME}!${columnLetter(idx)}${rowNumber}`, [[body.claimant]]));
    }
    if (typeof body.interactiveJson === 'string') {
      const idx = findHeaderIndex(headers, SHEET_COLUMNS.INTERACTIVE_JSON);
      updates.push(updateRange(spreadsheetId, `${SHEET_NAME}!${columnLetter(idx)}${rowNumber}`, [[body.interactiveJson]]));
    }
    await Promise.all(updates);
    revalidateItemPaths(body.itemId);
    return ok({ success: true });
  } catch (error) {
    return fail('更新失敗', 400, error instanceof Error ? error.message : undefined);
  }
}
