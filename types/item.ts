import type { ClaimEntry, CommentEntry, RecommendationEntry, ReceiptEntry } from './comment';
export type ItemCategory = '食材' | '器材' | '文具' | '場佈' | '其他';
export interface ItemInteractiveData {
  comments: CommentEntry[];
  recommendations: RecommendationEntry[];
  receipts: ReceiptEntry[];
  claims: ClaimEntry[];
  images: string[];
}
export interface ItemRecord {
  id: string;
  itemName: string;
  category: ItemCategory;
  requiredQty: number;
  budgetUnitPrice: number;
  actualUnitPrice: number | null;
  claimant: string | null;
  receiptLink: string | null;
  interactiveData: ItemInteractiveData;
  budgetTotal: number;
  actualTotal: number;
  variance: number;
}
