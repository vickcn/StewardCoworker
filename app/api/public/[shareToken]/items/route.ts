import { db } from '@/lib/db';
import { ok, fail } from '@/lib/utils/response';
import { fetchProjectItems } from '@/lib/google/project-integration';
import type { PublicItemRecord } from '@/types/share';
import type { ItemRecord } from '@/types/item';

async function resolveShare(shareToken: string) {
  const share = await db.projectPublicShare.findUnique({
    where: { shareToken },
    include: { project: true },
  });
  if (!share || !share.isEnabled) return null;
  return share;
}

function filterItemForPublic(item: ItemRecord, visibleFields: string[]): PublicItemRecord {
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

  // Redact fields not in visibleFields (if list is non-empty)
  if (visibleFields.length > 0) {
    if (!visibleFields.includes('budgetUnitPrice')) {
      base.budgetUnitPrice = 0;
      base.budgetTotal = 0;
    }
    if (!visibleFields.includes('actualUnitPrice')) {
      base.actualUnitPrice = null;
      base.actualTotal = 0;
    }
    if (!visibleFields.includes('claimant')) {
      base.claimant = null;
    }
  }

  return base;
}

// GET /api/public/[shareToken]/items
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  const { shareToken } = await params;
  const share = await resolveShare(shareToken);
  if (!share) return fail('Not found or sharing disabled', 404);

  const visibleFields = JSON.parse(share.visibleFields) as string[];

  try {
    const items = await fetchProjectItems(share.projectId);
    const publicItems = items.map((item) => filterItemForPublic(item, visibleFields));
    return ok(publicItems);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch items';
    return fail(message, 500);
  }
}
