import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getRequiredEnv } from '@/lib/utils/env';
import { fail, ok } from '@/lib/utils/response';
import { readAllRows, getRowById, updateRange, findHeaderIndex, columnLetter } from '@/lib/google/sheets';
import { SHEET_COLUMNS, SHEET_NAME } from '@/lib/constants/sheet';
import { parseInteractiveData, stringifyInteractiveData } from '@/lib/data/json-field';
import { addClaimSchema, addCommentSchema, addRecommendationSchema, uploadBase64Schema } from '@/lib/data/validators';
import { randomId } from '@/lib/utils/string';
import { nowIso } from '@/lib/utils/datetime';
import { uploadFileToDrive } from '@/lib/google/drive';
import { revalidateItemPaths } from '@/lib/cache/revalidate';

const actionSchema = z.object({
  action: z.enum(['ADD_COMMENT', 'ADD_RECOMMENDATION', 'ADD_CLAIM', 'UPLOAD_RECEIPT', 'UPLOAD_IMAGE']),
  itemId: z.string().min(1),
  payload: z.unknown(),
});


export async function POST(req: NextRequest) {
  try {
    const body = actionSchema.parse(await req.json());
    const spreadsheetId = getRequiredEnv('SPREADSHEET_ID');
    const rows = await readAllRows(spreadsheetId);
    const found = getRowById(rows, body.itemId);
    if (!found) return fail('找不到品項', 404);

    const { headers, row, rowNumber } = found;
    const interactiveIdx = findHeaderIndex(headers, SHEET_COLUMNS.INTERACTIVE_JSON);
    const claimantIdx = findHeaderIndex(headers, SHEET_COLUMNS.CLAIMANT);
    const receiptIdx = findHeaderIndex(headers, SHEET_COLUMNS.RECEIPT_LINK);
    const interactiveData = parseInteractiveData(row[interactiveIdx]);
    const jsonRange = `${SHEET_NAME}!${columnLetter(interactiveIdx)}${rowNumber}`;

    if (body.action === 'ADD_COMMENT') {
      const payload = addCommentSchema.parse(body.payload);
      interactiveData.comments.unshift({ id: randomId('comment'), type: 'comment', author: payload.author, content: payload.content, createdAt: nowIso() });
      await updateRange(spreadsheetId, jsonRange, [[stringifyInteractiveData(interactiveData)]]);
      revalidateItemPaths(body.itemId);
      return ok({ success: true });
    }

    if (body.action === 'ADD_RECOMMENDATION') {
      const payload = addRecommendationSchema.parse(body.payload);
      interactiveData.recommendations.unshift({ id: randomId('recommendation'), type: 'recommendation', author: payload.author, title: payload.title, url: payload.url, note: payload.note || undefined, createdAt: nowIso() });
      await updateRange(spreadsheetId, jsonRange, [[stringifyInteractiveData(interactiveData)]]);
      revalidateItemPaths(body.itemId);
      return ok({ success: true });
    }

    if (body.action === 'ADD_CLAIM') {
      const payload = addClaimSchema.parse(body.payload);
      interactiveData.claims.unshift({ id: randomId('claim'), type: 'claim', author: payload.author, note: payload.note || undefined, createdAt: nowIso() });
      await updateRange(spreadsheetId, jsonRange, [[stringifyInteractiveData(interactiveData)]]);
      await updateRange(spreadsheetId, `${SHEET_NAME}!${columnLetter(claimantIdx)}${rowNumber}`, [[payload.author]]);
      revalidateItemPaths(body.itemId);
      return ok({ success: true });
    }

    if (body.action === 'UPLOAD_RECEIPT' || body.action === 'UPLOAD_IMAGE') {
      const payload = uploadBase64Schema.parse(body.payload);
      const base64Content = payload.base64.includes(',') ? payload.base64.split(',')[1] : payload.base64;
      const buffer = Buffer.from(base64Content, 'base64');
      const uploaded = await uploadFileToDrive({
        folderId: getRequiredEnv('GOOGLE_DRIVE_FOLDER_ID'),
        fileName: payload.fileName,
        mimeType: payload.mimeType,
        buffer,
      });

      const url = uploaded.webViewLink || uploaded.webContentLink || '';
      if (body.action === 'UPLOAD_RECEIPT') {
        interactiveData.receipts.unshift({ id: randomId('receipt'), type: 'receipt', author: payload.author, fileUrl: url, fileName: payload.fileName, note: payload.note || undefined, createdAt: nowIso() });
        await updateRange(spreadsheetId, `${SHEET_NAME}!${columnLetter(receiptIdx)}${rowNumber}`, [[url]]);
      } else {
        interactiveData.images.unshift(url);
      }

      await updateRange(spreadsheetId, jsonRange, [[stringifyInteractiveData(interactiveData)]]);
      revalidateItemPaths(body.itemId);
      return ok({ success: true });
    }

    return fail('不支援的操作', 400);
  } catch (error) {
    return fail('操作失敗', 400, error instanceof Error ? error.message : undefined);
  }
}
