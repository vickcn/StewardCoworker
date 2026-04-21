import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { fetchProjectItems } from '@/lib/google/project-integration';
import { PublicItemCard } from '@/components/public/PublicItemCard';
import type { PublicItemRecord } from '@/types/share';
import type { ItemRecord } from '@/types/item';

function filterItem(item: ItemRecord, visibleFields: string[]): PublicItemRecord {
  const base: PublicItemRecord = {
    id: item.id,
    itemName: item.itemName,
    category: item.category,
    requiredQty: item.requiredQty,
    budgetUnitPrice: item.budgetUnitPrice,
    actualUnitPrice: item.actualUnitPrice,
    claimant: item.claimant,
    budgetTotal: item.budgetTotal,
    actualTotal: item.actualTotal,
    interactiveData: item.interactiveData,
  };
  if (visibleFields.length > 0) {
    if (!visibleFields.includes('budgetUnitPrice')) { base.budgetUnitPrice = 0; base.budgetTotal = 0; }
    if (!visibleFields.includes('actualUnitPrice')) { base.actualUnitPrice = null; base.actualTotal = 0; }
    if (!visibleFields.includes('claimant')) base.claimant = null;
  }
  return base;
}

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const share = await db.projectPublicShare.findUnique({ where: { shareToken } });
  if (!share || !share.isEnabled) notFound();

  const visibleFields = JSON.parse(share.visibleFields) as string[];

  let items: PublicItemRecord[] = [];
  let error = '';
  try {
    const raw = await fetchProjectItems(share.projectId);
    items = raw.map((item) => filterItem(item, visibleFields));
  } catch (err) {
    error = err instanceof Error ? err.message : '無法載入品項';
  }

  const claimedCount = items.filter((i) => i.claimant).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="品項總數" value={items.length} />
        <StatCard label="已認領" value={claimedCount} />
        <StatCard label="未認領" value={items.length - claimedCount} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {items.length === 0 && !error && (
        <p className="text-center text-gray-500 py-12">目前沒有品項</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <PublicItemCard
            key={item.id}
            item={item}
            shareToken={shareToken}
            shareSettings={{
              allowClaim: share.allowClaim,
              allowComment: share.allowComment,
              allowRecommendation: share.allowRecommendation,
              allowReceiptUpload: share.allowReceiptUpload,
              visibleFields,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-4 text-center shadow-sm">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
