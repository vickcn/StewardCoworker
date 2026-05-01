import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { ok, fail } from '@/lib/utils/response';
import {
  deleteProjectItem,
  fetchProjectItemById,
  updateItemField,
  updateItemInteractiveData,
} from '@/lib/google/project-integration';
import { SHEET_COLUMNS } from '@/lib/constants/sheet';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

async function requireMembership(projectId: string, email: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return null;
  return db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
}

// GET /api/projects/[projectId]/items/[itemId]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string; itemId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) return fail('Unauthorized', 401);
  const { projectId, itemId } = await params;

  const member = await requireMembership(projectId, session.user.email);
  if (!member) return fail('Forbidden', 403);

  try {
    const item = await fetchProjectItemById(projectId, itemId);
    if (!item) return fail('Item not found', 404);
    return ok(item);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch item';
    return fail(message, 500);
  }
}

const updateItemSchema = z.object({
  itemName: z.string().min(1).max(200).optional(),
  claimant: z.string().max(100).nullable().optional(),
  interactiveData: z.any().optional(),
});

// PUT /api/projects/[projectId]/items/[itemId]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ projectId: string; itemId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) return fail('Unauthorized', 401);
  const { projectId, itemId } = await params;

  const member = await requireMembership(projectId, session.user.email);
  if (!member || member.role === 'MEMBER') return fail('Forbidden', 403);

  const body = await req.json();
  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) return fail('Invalid input', 400, parsed.error.flatten());

  try {
    if (parsed.data.itemName !== undefined) {
      await updateItemField(projectId, itemId, SHEET_COLUMNS.ITEM_NAME, parsed.data.itemName);
    }
    if (parsed.data.claimant !== undefined) {
      await updateItemField(projectId, itemId, SHEET_COLUMNS.CLAIMANT, parsed.data.claimant);
    }
    if (parsed.data.interactiveData !== undefined) {
      await updateItemInteractiveData(projectId, itemId, () => parsed.data.interactiveData);
    }

    revalidatePath(`/projects/${projectId}`);
    return ok({ updated: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return fail(message, 500);
  }
}

// DELETE /api/projects/[projectId]/items/[itemId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ projectId: string; itemId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) return fail('Unauthorized', 401);
  const { projectId, itemId } = await params;

  const member = await requireMembership(projectId, session.user.email);
  if (!member || member.role === 'MEMBER') return fail('Forbidden', 403);

  try {
    await deleteProjectItem(projectId, itemId);
    revalidatePath(`/projects/${projectId}`);
    return ok({ deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete failed';
    return fail(message, 500);
  }
}
