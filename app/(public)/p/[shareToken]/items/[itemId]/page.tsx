import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { fetchProjectItemById } from '@/lib/google/project-integration';
import { CommentForm } from '@/components/item/CommentForm';
import { CommentList } from '@/components/item/CommentList';
import { PublicClaimForm } from '@/components/public/PublicClaimForm';
import { PublicRecommendationForm } from '@/components/public/PublicRecommendationForm';
import Link from 'next/link';

export default async function PublicItemDetailPage({
  params,
}: {
  params: Promise<{ shareToken: string; itemId: string }>;
}) {
  const { shareToken, itemId } = await params;
  const share = await db.projectPublicShare.findUnique({ where: { shareToken } });
  if (!share || !share.isEnabled) notFound();

  const item = await fetchProjectItemById(share.projectId, itemId);
  if (!item) notFound();

  const visibleFields = JSON.parse(share.visibleFields) as string[];
  const showBudget = visibleFields.length === 0 || visibleFields.includes('budgetUnitPrice');
  const showClaimant = visibleFields.length === 0 || visibleFields.includes('claimant');

  return (
    <div className="space-y-6">
      <Link href={`/p/${shareToken}`} className="text-sm text-blue-600 hover:underline">
        ← 返回品項列表
      </Link>

      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {item.category}
            </span>
            <h2 className="mt-2 text-xl font-bold text-gray-900">{item.itemName}</h2>
          </div>
          {showClaimant && item.claimant && (
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
              已認領：{item.claimant}
            </span>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-gray-500">需求數量</dt>
            <dd className="font-medium">{item.requiredQty}</dd>
          </div>
          {showBudget && (
            <>
              <div>
                <dt className="text-gray-500">預算單價</dt>
                <dd className="font-medium">NT$ {item.budgetUnitPrice.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-gray-500">預算合計</dt>
                <dd className="font-medium">NT$ {item.budgetTotal.toLocaleString()}</dd>
              </div>
            </>
          )}
        </dl>
      </div>

      {share.allowClaim && !item.claimant && (
        <PublicClaimForm shareToken={shareToken} itemId={item.id} />
      )}

      {share.allowRecommendation && (
        <PublicRecommendationForm shareToken={shareToken} itemId={item.id} />
      )}

      {share.allowComment && (
        <div className="space-y-4">
          <CommentList comments={item.interactiveData.comments} />
          <CommentForm shareToken={shareToken} itemId={item.id} />
        </div>
      )}
    </div>
  );
}
