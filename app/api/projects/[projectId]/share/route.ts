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
  return member && member.role !== 'MEMBER' ? member : null;
}

// GET /api/projects/[projectId]/share
export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return fail('Unauthorized', 401);
  const { projectId } = await params;

  const member = await requireAdminRole(projectId, session.user.email);
  if (!member) return fail('Forbidden', 403);

  const share = await db.projectPublicShare.findUnique({ where: { projectId } });
  if (!share) return fail('Share settings not found', 404);

  return ok({
    ...share,
    visibleFields: JSON.parse(share.visibleFields) as string[],
    createdAt: share.createdAt.toISOString(),
    updatedAt: share.updatedAt.toISOString(),
  });
}

const updateShareSchema = z.object({
  isEnabled: z.boolean().optional(),
  allowClaim: z.boolean().optional(),
  allowComment: z.boolean().optional(),
  allowRecommendation: z.boolean().optional(),
  allowReceiptUpload: z.boolean().optional(),
  visibleFields: z.array(z.string()).optional(),
});

// PUT /api/projects/[projectId]/share
export async function PUT(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return fail('Unauthorized', 401);
  const { projectId } = await params;

  const member = await requireAdminRole(projectId, session.user.email);
  if (!member) return fail('Forbidden', 403);

  const body = await req.json();
  const parsed = updateShareSchema.safeParse(body);
  if (!parsed.success) return fail('Invalid input', 400, parsed.error.flatten());

  const { visibleFields, ...rest } = parsed.data;
  const updateData = {
    ...rest,
    ...(visibleFields !== undefined ? { visibleFields: JSON.stringify(visibleFields) } : {}),
  };

  const share = await db.projectPublicShare.upsert({
    where: { projectId },
    update: updateData,
    create: { projectId, ...updateData },
  });

  return ok({
    ...share,
    visibleFields: JSON.parse(share.visibleFields) as string[],
    createdAt: share.createdAt.toISOString(),
    updatedAt: share.updatedAt.toISOString(),
  });
}
