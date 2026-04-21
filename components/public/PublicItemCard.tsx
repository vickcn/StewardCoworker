'use client';
import Link from 'next/link';
import type { PublicItemRecord } from '@/types/share';

interface ShareSettings {
  allowClaim: boolean;
  allowComment: boolean;
  allowRecommendation: boolean;
  allowReceiptUpload: boolean;
  visibleFields: string[];
}

interface Props {
  item: PublicItemRecord;
  shareToken: string;
  shareSettings: ShareSettings;
}

export function PublicItemCard({ item, shareToken, shareSettings }: Props) {
  const isClaimed = !!item.claimant;
  const showClaimant = shareSettings.visibleFields.length === 0 || shareSettings.visibleFields.includes('claimant');

  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${isClaimed ? 'border-green-200' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {item.category}
          </span>
          <h3 className="mt-1 font-semibold text-gray-900 line-clamp-2">{item.itemName}</h3>
        </div>
        {isClaimed && showClaimant && (
          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
            已認領
          </span>
        )}
        {!isClaimed && (
          <span className="shrink-0 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
            待認領
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
        <span>× {item.requiredQty}</span>
        {item.interactiveData.comments.length > 0 && (
          <span className="text-xs text-gray-400">
            {item.interactiveData.comments.length} 則留言
          </span>
        )}
      </div>

      <Link
        href={`/p/${shareToken}/items/${item.id}`}
        className="mt-3 block rounded-lg bg-blue-50 py-1.5 text-center text-sm font-medium text-blue-700 hover:bg-blue-100"
      >
        查看詳情
      </Link>
    </div>
  );
}
