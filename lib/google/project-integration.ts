import { db } from '@/lib/db';
import { readAllRows, updateRange, findHeaderIndex, findRowIndexById, columnLetter } from './sheets';
import { uploadFileToDrive } from './drive';
import { mapRowToItem } from '@/lib/data/item-mapper';
import type { ItemRecord } from '@/types/item';
import { SHEET_COLUMNS } from '@/lib/constants/sheet';
import { stringifyInteractiveData } from '@/lib/data/json-field';

export async function getProjectIntegration(projectId: string) {
  const integration = await db.projectIntegration.findUnique({ where: { projectId } });
  if (!integration?.spreadsheetId || !integration.sheetName) {
    throw new Error('Project Google Sheet not configured');
  }
  return integration;
}

export async function fetchProjectItems(projectId: string): Promise<ItemRecord[]> {
  const integration = await getProjectIntegration(projectId);
  const rows = await readAllRows(integration.spreadsheetId!, integration.sheetName!);
  if (rows.length < 2) return [];
  const [headers, ...dataRows] = rows;
  return dataRows
    .filter((row) => row[headers.indexOf(SHEET_COLUMNS.ID)])
    .map((row) => mapRowToItem(headers, row));
}

export async function fetchProjectItemById(projectId: string, itemId: string): Promise<ItemRecord | null> {
  const integration = await getProjectIntegration(projectId);
  const rows = await readAllRows(integration.spreadsheetId!, integration.sheetName!);
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
  const integration = await getProjectIntegration(projectId);
  const rows = await readAllRows(integration.spreadsheetId!, integration.sheetName!);
  const rowNumber = findRowIndexById(rows, itemId);
  if (rowNumber === -1) throw new Error('Item not found');
  const colIdx = findHeaderIndex(rows[0], column);
  const cellRef = `${integration.sheetName}!${columnLetter(colIdx)}${rowNumber}`;
  await updateRange(integration.spreadsheetId!, cellRef, [[value]]);
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
  const integration = await getProjectIntegration(projectId);
  if (!integration.driveFolderId) throw new Error('Project Drive folder not configured');
  return uploadFileToDrive({ folderId: integration.driveFolderId, ...file });
}
