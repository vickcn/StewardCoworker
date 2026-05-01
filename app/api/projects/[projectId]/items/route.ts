import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { ok, fail } from '@/lib/utils/response';
import { createProjectItem, fetchProjectItems } from '@/lib/google/project-integration';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

async function resolveCallerMembership(projectId: string, email: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return null;
  return db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
}

// GET /api/projects/[projectId]/items
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) return fail('Unauthorized', 401);
  const { projectId } = await params;

  const member = await resolveCallerMembership(projectId, session.user.email);
  if (!member) return fail('Forbidden', 403);

  try {
    const items = await fetchProjectItems(projectId);
    return ok(items);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch items';
    return fail(message, 500);
  }
}

const createItemSchema = z.object({
  itemName: z.string().min(1).max(200),
  category: z.enum(['食材', '器材', '文具', '場佈', '其他']),
  requiredQty: z.coerce.number().nonnegative(),
  budgetUnitPrice: z.coerce.number().nonnegative(),
  actualUnitPrice: z.coerce.number().nonnegative().nullable().optional(),
  claimant: z.string().max(100).nullable().optional(),
});

// POST /api/projects/[projectId]/items
export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) return fail('Unauthorized', 401);
  const { projectId } = await params;

  const member = await resolveCallerMembership(projectId, session.user.email);
  if (!member || member.role === 'MEMBER') return fail('Forbidden', 403);

  const body = await req.json();
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) return fail('Invalid input', 400, parsed.error.flatten());

  try {
    await createProjectItem(projectId, parsed.data);
    revalidatePath(`/projects/${projectId}`);
    return ok({ created: true }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create item';
    return fail(message, 500);
  }
}
