import { db } from '@/lib/db';
import { ok, fail } from '@/lib/utils/response';
import { fetchProjectItemById } from '@/lib/google/project-integration';

// GET /api/public/[shareToken]/items/[itemId]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shareToken: string; itemId: string }> },
) {
  const { shareToken, itemId } = await params;

  const share = await db.projectPublicShare.findUnique({ where: { shareToken } });
  if (!share || !share.isEnabled) return fail('Not found or sharing disabled', 404);

  try {
    const item = await fetchProjectItemById(share.projectId, itemId);
    if (!item) return fail('Item not found', 404);
    return ok(item);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch item';
    return fail(message, 500);
  }
}
