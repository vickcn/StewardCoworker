import type { ItemInteractiveData } from './item';

export interface PublicProjectInfo {
  name: string;
  description: string | null;
  eventDate: string | null;
  shareSettings: {
    allowClaim: boolean;
    allowComment: boolean;
    allowRecommendation: boolean;
    allowReceiptUpload: boolean;
    visibleFields: string[];
  };
}

export interface PublicItemRecord {
  id: string;
  itemName: string;
  category: string;
  requiredQty: number;
  budgetUnitPrice: number;
  actualUnitPrice: number | null;
  claimant: string | null;
  budgetTotal: number;
  actualTotal: number;
  interactiveData: ItemInteractiveData;
}

export type PublicActionType =
  | 'ADD_COMMENT'
  | 'ADD_CLAIM'
  | 'ADD_RECOMMENDATION'
  | 'UPLOAD_RECEIPT'
  | 'UPLOAD_IMAGE';
