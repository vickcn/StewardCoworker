import { db } from '@/lib/db';
import {
  appendRow,
  clearRange,
  ensureHeaders,
  readAllRows,
  updateRange,
  findHeaderIndex,
  findRowIndexById,
  columnLetter,
} from './sheets';
import { ensureDriveFolderPath, uploadFileToDrive } from './drive';
import { getProjectGoogleOAuthClient } from './user-oauth';
import { mapRowToItem } from '@/lib/data/item-mapper';
import type { ItemRecord } from '@/types/item';
import { SHEET_COLUMNS } from '@/lib/constants/sheet';
import { emptyInteractiveData, stringifyInteractiveData } from '@/lib/data/json-field';
import { randomId } from '@/lib/utils/string';

export async function getProjectIntegration(projectId: string) {
  const integration = await db.projectIntegration.findUnique({ where: { projectId } });
  if (!integration?.spreadsheetId || !integration.sheetName) {
    throw new Error('Project Google Sheet not configured');
  }
  return integration;
}

async function getProjectGoogleContext(projectId: string) {
  const integration = await getProjectIntegration(projectId);
  const auth = await getProjectGoogleOAuthClient(projectId, integration.googleCredentialUserId);
  return { integration, auth };
}

export async function fetchProjectItems(projectId: string): Promise<ItemRecord[]> {
  const { integration, auth } = await getProjectGoogleContext(projectId);
  const rows = await readAllRows(auth, integration.spreadsheetId!, integration.sheetName!);
  if (rows.length < 2) return [];
  const [headers, ...dataRows] = rows;
  return dataRows
    .filter((row) => row[headers.indexOf(SHEET_COLUMNS.ID)])
    .map((row) => mapRowToItem(headers, row));
}

export async function fetchProjectItemById(projectId: string, itemId: string): Promise<ItemRecord | null> {
  const { integration, auth } = await getProjectGoogleContext(projectId);
  const rows = await readAllRows(auth, integration.spreadsheetId!, integration.sheetName!);
  const [headers, ...dataRows] = rows;
  const row = dataRows.find((r) => r[headers.indexOf(SHEET_COLUMNS.ID)] === itemId);
  return row ? mapRowToItem(headers, row) : null;
}

export async function updateItemField(
  projectId: string,
  itemId: string,
  column: string,
  value: string | number | null,
) {
  const { integration, auth } = await getProjectGoogleContext(projectId);
  const rows = await readAllRows(auth, integration.spreadsheetId!, integration.sheetName!);
  const rowNumber = findRowIndexById(rows, itemId);
  if (rowNumber === -1) throw new Error('Item not found');
  const colIdx = findHeaderIndex(rows[0], column);
  const cellRef = `${integration.sheetName}!${columnLetter(colIdx)}${rowNumber}`;
  await updateRange(auth, integration.spreadsheetId!, cellRef, [[value]]);
}

export async function updateItemInteractiveData(
  projectId: string,
  itemId: string,
  updater: (prev: ItemRecord) => ItemRecord['interactiveData'],
) {
  const item = await fetchProjectItemById(projectId, itemId);
  if (!item) throw new Error('Item not found');
  const newData = updater(item);
  await updateItemField(projectId, itemId, SHEET_COLUMNS.INTERACTIVE_JSON, stringifyInteractiveData(newData));
  return newData;
}

export async function uploadProjectFile(
  projectId: string,
  file: { fileName: string; mimeType: string; buffer: Buffer },
) {
  const { integration, auth } = await getProjectGoogleContext(projectId);
  if (!integration.driveFolderId) throw new Error('Project Drive folder not configured');
  return uploadFileToDrive({ auth, folderId: integration.driveFolderId, ...file });
}

export async function uploadProjectFileToPath(
  projectId: string,
  pathSegments: string[],
  file: { fileName: string; mimeType: string; buffer: Buffer },
) {
  const { integration, auth } = await getProjectGoogleContext(projectId);
  if (!integration.driveFolderId) throw new Error('Project Drive folder not configured');
  const folderId = await ensureDriveFolderPath({
    auth,
    rootFolderId: integration.driveFolderId,
    pathSegments,
  });
  return uploadFileToDrive({ auth, folderId, ...file });
}

export async function createProjectItem(
  projectId: string,
  input: {
    itemName: string;
    category: ItemRecord['category'];
    requiredQty: number;
    budgetUnitPrice: number;
    actualUnitPrice?: number | null;
    claimant?: string | null;
  },
) {
  const { integration, auth } = await getProjectGoogleContext(projectId);
  const spreadsheetId = integration.spreadsheetId!;
  const sheetName = integration.sheetName!;
  await ensureHeaders(auth, spreadsheetId, sheetName);
  const rows = await readAllRows(auth, spreadsheetId, sheetName);
  const headers = rows[0] ?? [];

  const idIndex = findHeaderIndex(headers, SHEET_COLUMNS.ID);
  const itemNameIndex = findHeaderIndex(headers, SHEET_COLUMNS.ITEM_NAME);
  const categoryIndex = findHeaderIndex(headers, SHEET_COLUMNS.CATEGORY);
  const requiredQtyIndex = findHeaderIndex(headers, SHEET_COLUMNS.REQUIRED_QTY);
  const budgetUnitPriceIndex = findHeaderIndex(headers, SHEET_COLUMNS.BUDGET_UNIT_PRICE);
  const actualUnitPriceIndex = findHeaderIndex(headers, SHEET_COLUMNS.ACTUAL_UNIT_PRICE);
  const claimantIndex = findHeaderIndex(headers, SHEET_COLUMNS.CLAIMANT);
  const receiptLinkIndex = findHeaderIndex(headers, SHEET_COLUMNS.RECEIPT_LINK);
  const interactiveIndex = findHeaderIndex(headers, SHEET_COLUMNS.INTERACTIVE_JSON);

  const requiredIndexes = [
    idIndex,
    itemNameIndex,
    categoryIndex,
    requiredQtyIndex,
    budgetUnitPriceIndex,
    actualUnitPriceIndex,
    claimantIndex,
    receiptLinkIndex,
    interactiveIndex,
  ];
  if (requiredIndexes.some((idx) => idx < 0)) {
    throw new Error('Google Sheet 欄位不完整，請確認標題列包含系統需要的欄位。');
  }

  const values: (string | number | null)[] = Array.from(
    { length: Math.max(headers.length, 9) },
    () => '',
  );
  values[idIndex] = randomId('item');
  values[itemNameIndex] = input.itemName;
  values[categoryIndex] = input.category;
  values[requiredQtyIndex] = input.requiredQty;
  values[budgetUnitPriceIndex] = input.budgetUnitPrice;
  values[actualUnitPriceIndex] = input.actualUnitPrice ?? '';
  values[claimantIndex] = input.claimant ?? '';
  values[receiptLinkIndex] = '';
  values[interactiveIndex] = stringifyInteractiveData(emptyInteractiveData());

  await appendRow(auth, spreadsheetId, `${sheetName}!A:Z`, values);
}

export async function deleteProjectItem(projectId: string, itemId: string) {
  const { integration, auth } = await getProjectGoogleContext(projectId);
  const spreadsheetId = integration.spreadsheetId!;
  const sheetName = integration.sheetName!;
  const rows = await readAllRows(auth, spreadsheetId, sheetName);
  const rowNumber = findRowIndexById(rows, itemId);
  if (rowNumber === -1) throw new Error('Item not found');
  await clearRange(auth, spreadsheetId, `${sheetName}!A${rowNumber}:Z${rowNumber}`);
}
