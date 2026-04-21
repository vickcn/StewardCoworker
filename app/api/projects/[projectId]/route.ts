import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { ok, fail } from '@/lib/utils/response';
import { z } from 'zod';

async function resolveCallerRole(projectId: string, email: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return null;
  const member = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  return member ? (member.role as 'OWNER' | 'ADMIN' | 'MEMBER') : null;
}

// GET /api/projects/[projectId]
export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return fail('Unauthorized', 401);
  const { projectId } = await params;

  const role = await resolveCallerRole(projectId, session.user.email);
  if (!role) return fail('Not found', 404);

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      members: { include: { user: true } },
      integration: true,
      publicShare: true,
    },
  });
  if (!project) return fail('Not found', 404);

  return ok({
    id: project.id,
    name: project.name,
    description: project.description,
    eventDate: project.eventDate,
    isArchived: project.isArchived,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    myRole: role,
    members: project.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      name: m.user.name,
      image: m.user.image,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
    })),
    integration: project.integration
      ? {
          id: project.integration.id,
          spreadsheetId: project.integration.spreadsheetId,
          sheetName: project.integration.sheetName,
          driveFolderId: project.integration.driveFolderId,
        }
      : null,
    publicShare: project.publicShare
      ? {
          id: project.publicShare.id,
          shareToken: project.publicShare.shareToken,
          isEnabled: project.publicShare.isEnabled,
          allowClaim: project.publicShare.allowClaim,
          allowComment: project.publicShare.allowComment,
          allowRecommendation: project.publicShare.allowRecommendation,
          allowReceiptUpload: project.publicShare.allowReceiptUpload,
          visibleFields: JSON.parse(project.publicShare.visibleFields) as string[],
        }
      : null,
  });
}

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  eventDate: z.string().nullable().optional(),
  isArchived: z.boolean().optional(),
});

// PUT /api/projects/[projectId]
export async function PUT(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return fail('Unauthorized', 401);
  const { projectId } = await params;

  const role = await resolveCallerRole(projectId, session.user.email);
  if (!role || role === 'MEMBER') return fail('Forbidden', 403);

  const body = await req.json();
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) return fail('Invalid input', 400, parsed.error.flatten());

  const updated = await db.project.update({
    where: { id: projectId },
    data: parsed.data,
  });

  return ok({ id: updated.id, name: updated.name });
}

// DELETE /api/projects/[projectId]
export async function DELETE(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return fail('Unauthorized', 401);
  const { projectId } = await params;

  const role = await resolveCallerRole(projectId, session.user.email);
  if (role !== 'OWNER') return fail('Forbidden', 403);

  await db.project.delete({ where: { id: projectId } });
  return ok({ deleted: true });
}
