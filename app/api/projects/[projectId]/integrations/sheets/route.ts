import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { listSheetTitles } from '@/lib/google/sheets';
import { getProjectGoogleOAuthClient } from '@/lib/google/user-oauth';
import { fail, ok } from '@/lib/utils/response';

async function requireAdminRole(projectId: string, email: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return null;
  const member = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  return member && member.role !== 'MEMBER' ? member : null;
}

function normalizeSpreadsheetId(value: string | null) {
  if (!value) return null;
  const input = value.trim();
  if (!input) return null;
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? input;
}

// GET /api/projects/[projectId]/integrations/sheets?spreadsheetId=...
export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) return fail('Unauthorized', 401);

  const { projectId } = await params;
  const member = await requireAdminRole(projectId, session.user.email);
  if (!member) return fail('Forbidden', 403);

  const { searchParams } = new URL(req.url);
  const spreadsheetId = normalizeSpreadsheetId(searchParams.get('spreadsheetId'));
  if (!spreadsheetId) return fail('Missing spreadsheetId', 400);

  try {
    const oauthClient = await getProjectGoogleOAuthClient(projectId, member.userId);
    const sheetNames = await listSheetTitles(oauthClient, spreadsheetId);
    return ok({ sheetNames });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load sheet names';
    return fail(message, 500);
  }
}
