import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { ok, fail } from '@/lib/utils/response';
import { fetchProjectItems } from '@/lib/google/project-integration';
import { revalidatePath } from 'next/cache';

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

// POST /api/projects/[projectId]/items — trigger manual cache revalidation
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) return fail('Unauthorized', 401);
  const { projectId } = await params;

  const member = await resolveCallerMembership(projectId, session.user.email);
  if (!member || member.role === 'MEMBER') return fail('Forbidden', 403);

  revalidatePath(`/projects/${projectId}`);
  return ok({ revalidated: true });
}
