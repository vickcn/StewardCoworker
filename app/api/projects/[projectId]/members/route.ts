import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { ok, fail } from '@/lib/utils/response';
import { z } from 'zod';

async function requireAdminRole(projectId: string, email: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return null;
  const member = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (!member || member.role === 'MEMBER') return null;
  return { user, role: member.role as 'OWNER' | 'ADMIN' };
}

// GET /api/projects/[projectId]/members
export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return fail('Unauthorized', 401);
  const { projectId } = await params;

  const caller = await requireAdminRole(projectId, session.user.email);
  if (!caller) return fail('Forbidden', 403);

  const members = await db.projectMember.findMany({
    where: { projectId },
    include: { user: true },
  });

  return ok(
    members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      name: m.user.name,
      image: m.user.image,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
    })),
  );
}

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

// POST /api/projects/[projectId]/members — invite by email
export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return fail('Unauthorized', 401);
  const { projectId } = await params;

  const caller = await requireAdminRole(projectId, session.user.email);
  if (!caller) return fail('Forbidden', 403);

  const body = await req.json();
  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) return fail('Invalid input', 400, parsed.error.flatten());

  const { email, role } = parsed.data;

  // Find or create the invited user record
  const invitedUser = await db.user.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  const existing = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: invitedUser.id } },
  });
  if (existing) return fail('User is already a member', 409);

  const member = await db.projectMember.create({
    data: { projectId, userId: invitedUser.id, role },
    include: { user: true },
  });

  return ok(
    {
      id: member.id,
      userId: member.userId,
      email: member.user.email,
      name: member.user.name,
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
    },
    201,
  );
}

// DELETE /api/projects/[projectId]/members?userId=xxx
export async function DELETE(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return fail('Unauthorized', 401);
  const { projectId } = await params;

  const caller = await requireAdminRole(projectId, session.user.email);
  if (!caller) return fail('Forbidden', 403);

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return fail('userId required', 400);

  const target = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!target) return fail('Member not found', 404);
  if (target.role === 'OWNER') return fail('Cannot remove project owner', 403);

  await db.projectMember.delete({ where: { projectId_userId: { projectId, userId } } });
  return ok({ removed: true });
}
