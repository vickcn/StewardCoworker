import { parseInteractiveData } from './json-field';
import type { ItemRecord } from '@/types/item';
import { SHEET_COLUMNS } from '@/lib/constants/sheet';

function safeNumber(value?: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[,$\s]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

export function mapRowToItem(headers: string[], row: string[]): ItemRecord {
  const get = (header: string) => row[headers.indexOf(header)] ?? '';
  const requiredQty = safeNumber(get(SHEET_COLUMNS.REQUIRED_QTY));
  const budgetUnitPrice = safeNumber(get(SHEET_COLUMNS.BUDGET_UNIT_PRICE));
  const rawActual = get(SHEET_COLUMNS.ACTUAL_UNIT_PRICE);
  const actualUnitPrice = rawActual ? safeNumber(rawActual) : null;
  const budgetTotal = requiredQty * budgetUnitPrice;
  const actualTotal = requiredQty * (actualUnitPrice ?? 0);
  return {
    id: get(SHEET_COLUMNS.ID),
    itemName: get(SHEET_COLUMNS.ITEM_NAME),
    category: (get(SHEET_COLUMNS.CATEGORY) || '其他') as ItemRecord['category'],
    requiredQty,
    budgetUnitPrice,
    actualUnitPrice,
    claimant: get(SHEET_COLUMNS.CLAIMANT) || null,
    receiptLink: get(SHEET_COLUMNS.RECEIPT_LINK) || null,
    interactiveData: parseInteractiveData(get(SHEET_COLUMNS.INTERACTIVE_JSON)),
    budgetTotal,
    actualTotal,
    variance: actualTotal - budgetTotal,
  };
}
