import { auth } from '@/lib/auth/auth';
import { db } from '@/lib/db';
import { getValidGoogleAccessTokenForUserId } from '@/lib/google/user-oauth';
import { fail, ok } from '@/lib/utils/response';

// GET /api/google/access-token
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return fail('Unauthorized', 401);

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return fail('Unauthorized', 401);

  try {
    const accessToken = await getValidGoogleAccessTokenForUserId(user.id);
    return ok({ accessToken });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to resolve Google access token';
    return fail(message, 401);
  }
}
