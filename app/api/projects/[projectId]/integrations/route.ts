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

// GET /api/projects/[projectId]/integrations
export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return fail('Unauthorized', 401);
  const { projectId } = await params;

  const member = await requireAdminRole(projectId, session.user.email);
  if (!member) return fail('Forbidden', 403);

  const integration = await db.projectIntegration.findUnique({ where: { projectId } });
  return ok(integration ?? null);
}

const updateIntegrationSchema = z.object({
  spreadsheetId: z.string().nullable().optional(),
  sheetName: z.string().nullable().optional(),
  driveFolderId: z.string().nullable().optional(),
});

function normalizeSpreadsheetId(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const input = value.trim();
  if (!input) return null;
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? input;
}

function normalizeDriveFolderId(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const input = value.trim();
  if (!input) return null;
  const match = input.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? input;
}

// PUT /api/projects/[projectId]/integrations
export async function PUT(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth();
  if (!session?.user?.email) return fail('Unauthorized', 401);
  const { projectId } = await params;

  const member = await requireAdminRole(projectId, session.user.email);
  if (!member) return fail('Forbidden', 403);

  const body = await req.json();
  const parsed = updateIntegrationSchema.safeParse(body);
  if (!parsed.success) return fail('Invalid input', 400, parsed.error.flatten());

  const normalized = {
    spreadsheetId: normalizeSpreadsheetId(parsed.data.spreadsheetId),
    sheetName: parsed.data.sheetName === undefined ? undefined : (parsed.data.sheetName?.trim() || null),
    driveFolderId: normalizeDriveFolderId(parsed.data.driveFolderId),
  };

  const integration = await db.projectIntegration.upsert({
    where: { projectId },
    update: {
      ...normalized,
      googleCredentialUserId: member.userId,
    },
    create: {
      projectId,
      ...normalized,
      googleCredentialUserId: member.userId,
    },
  });

  return ok(integration);
}
