import type { ItemInteractiveData } from '@/types/item';

export function emptyInteractiveData(): ItemInteractiveData {
  return { comments: [], recommendations: [], receipts: [], claims: [], images: [] };
}

export function parseInteractiveData(raw?: string): ItemInteractiveData {
  if (!raw) return emptyInteractiveData();
  try {
    const parsed = JSON.parse(raw) as Partial<ItemInteractiveData>;
    return {
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      receipts: Array.isArray(parsed.receipts) ? parsed.receipts : [],
      claims: Array.isArray(parsed.claims) ? parsed.claims : [],
      images: Array.isArray(parsed.images) ? parsed.images : [],
    };
  } catch {
    return emptyInteractiveData();
  }
}

export function stringifyInteractiveData(data: ItemInteractiveData): string {
  return JSON.stringify(data);
}
