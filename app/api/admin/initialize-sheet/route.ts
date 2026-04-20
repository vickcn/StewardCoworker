import { NextResponse } from 'next/server';
import { getRequiredEnv } from '@/lib/utils/env';
import { ensureHeaders } from '@/lib/google/sheets';
import { ok, fail } from '@/lib/utils/response';

export async function POST() {
  try {
    const spreadsheetId = getRequiredEnv('SPREADSHEET_ID');
    const { currentHeaders, missingHeaders } = await ensureHeaders(spreadsheetId);
    
    return ok({
      message: missingHeaders.length > 0 ? '試算表欄位已更新' : '試算表欄位已是最新狀態',
      currentHeaders,
      missingHeaders,
    });
  } catch (error) {
    return fail('初始化失敗', 500, error instanceof Error ? error.message : undefined);
  }
}
