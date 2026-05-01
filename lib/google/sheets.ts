import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import { SHEET_COLUMNS } from '@/lib/constants/sheet';

export async function getSheetsClient(auth: OAuth2Client) {
  return google.sheets({ version: 'v4', auth });
}

export async function listSheetTitles(
  auth: OAuth2Client,
  spreadsheetId: string,
): Promise<string[]> {
  const sheets = await getSheetsClient(auth);
  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets(properties(title))',
    includeGridData: false,
  });

  return (res.data.sheets ?? [])
    .map((s) => s.properties?.title)
    .filter((title): title is string => !!title);
}

export async function readAllRows(
  auth: OAuth2Client,
  spreadsheetId: string,
  sheetName: string,
): Promise<string[][]> {
  const sheets = await getSheetsClient(auth);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
  });
  return (res.data.values as string[][] | undefined) ?? [];
}

export async function updateRange(
  auth: OAuth2Client,
  spreadsheetId: string,
  range: string,
  values: (string | number | null)[][],
) {
  const sheets = await getSheetsClient(auth);
  return sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
}

export async function appendRow(
  auth: OAuth2Client,
  spreadsheetId: string,
  range: string,
  values: (string | number | null)[],
) {
  const sheets = await getSheetsClient(auth);
  return sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] },
  });
}

export async function clearRange(
  auth: OAuth2Client,
  spreadsheetId: string,
  range: string,
) {
  const sheets = await getSheetsClient(auth);
  return sheets.spreadsheets.values.clear({
    spreadsheetId,
    range,
  });
}

export function findHeaderIndex(headers: string[], headerName: string): number {
  return headers.indexOf(headerName);
}

export function findRowIndexById(rows: string[][], id: string): number {
  if (!rows.length) return -1;
  const idIndex = findHeaderIndex(rows[0], SHEET_COLUMNS.ID);
  for (let i = 1; i < rows.length; i += 1) {
    if ((rows[i][idIndex] ?? '') === id) return i + 1;
  }
  return -1;
}

export function getRowById(rows: string[][], id: string) {
  const rowNumber = findRowIndexById(rows, id);
  if (rowNumber === -1) return null;
  return { headers: rows[0], row: rows[rowNumber - 1], rowNumber };
}

export function columnLetter(index: number): string {
  if (index < 0) throw new Error('Invalid column index: column not found in spreadsheet.');
  let n = index + 1;
  let result = '';
  while (n > 0) {
    const mod = (n - 1) % 26;
    result = String.fromCharCode(65 + mod) + result;
    n = Math.floor((n - mod) / 26);
  }
  return result;
}

export async function ensureHeaders(auth: OAuth2Client, spreadsheetId: string, sheetName: string) {
  const sheets = await getSheetsClient(auth);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:Z1`,
  });
  const currentHeaders = res.data.values?.[0] || [];
  const requiredHeaders = Object.values(SHEET_COLUMNS);
  const missingHeaders = requiredHeaders.filter((h) => !currentHeaders.includes(h));

  if (missingHeaders.length > 0) {
    const newHeaders = [...currentHeaders];
    missingHeaders.forEach((h) => {
      if (!newHeaders.includes(h)) newHeaders.push(h);
    });
    await updateRange(auth, spreadsheetId, `${sheetName}!A1`, [newHeaders]);
  }
  return { currentHeaders, missingHeaders };
}
