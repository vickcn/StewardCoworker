export interface BaseInteractiveEntry { id: string; author: string; createdAt: string; }
export interface CommentEntry extends BaseInteractiveEntry { type: 'comment'; content: string; }
export interface RecommendationEntry extends BaseInteractiveEntry {
  type: 'recommendation';
  title: string;
  url: string;
  note?: string;
  imageUrl?: string;
  imageFileName?: string;
}
export interface ReceiptEntry extends BaseInteractiveEntry { type: 'receipt'; fileUrl: string; fileName?: string; note?: string; }
export interface ClaimEntry extends BaseInteractiveEntry { type: 'claim'; note?: string; }
