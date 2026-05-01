import { google } from 'googleapis';
import type { User } from '@prisma/client';
import { db } from '@/lib/db';
import { env } from '@/lib/utils/env';

const TOKEN_EXPIRY_SKEW_SECONDS = 60;

type GoogleTokenUser = Pick<
  User,
  'id' | 'googleAccessToken' | 'googleRefreshToken' | 'googleTokenExpiresAt'
>;

const googleTokenUserSelect = {
  id: true,
  googleAccessToken: true,
  googleRefreshToken: true,
  googleTokenExpiresAt: true,
} as const;

function createOAuthClient(user: GoogleTokenUser) {
  const client = new google.auth.OAuth2(
    env.googleOAuthClientId(),
    env.googleOAuthClientSecret(),
  );
  client.setCredentials({
    access_token: user.googleAccessToken ?? undefined,
    refresh_token: user.googleRefreshToken ?? undefined,
    expiry_date: user.googleTokenExpiresAt ? user.googleTokenExpiresAt * 1000 : undefined,
  });
  return client;
}

function hasUsableAccessToken(user: GoogleTokenUser): boolean {
  if (!user.googleAccessToken || !user.googleTokenExpiresAt) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return user.googleTokenExpiresAt > nowSeconds + TOKEN_EXPIRY_SKEW_SECONDS;
}

async function refreshUserToken(user: GoogleTokenUser): Promise<GoogleTokenUser> {
  if (!user.googleRefreshToken) {
    throw new Error('Google 授權已失效，請重新登入以授權 Drive/Sheets 存取。');
  }

  const oauth = createOAuthClient(user);
  let refreshedAccessToken: string | null | undefined;

  try {
    const tokenResult = await oauth.getAccessToken();
    refreshedAccessToken = tokenResult.token;
  } catch {
    throw new Error('Google 授權更新失敗，請重新登入後再試。');
  }

  if (!refreshedAccessToken) {
    throw new Error('無法更新 Google Access Token，請重新登入後再試。');
  }

  const refreshedExpirySeconds = oauth.credentials.expiry_date
    ? Math.floor(oauth.credentials.expiry_date / 1000)
    : Math.floor(Date.now() / 1000) + 3600;
  const refreshedRefreshToken = oauth.credentials.refresh_token ?? user.googleRefreshToken;

  return db.user.update({
    where: { id: user.id },
    data: {
      googleAccessToken: refreshedAccessToken,
      googleRefreshToken: refreshedRefreshToken,
      googleTokenExpiresAt: refreshedExpirySeconds,
    },
    select: googleTokenUserSelect,
  });
}

async function resolveCredentialUser(projectId: string, configuredUserId: string | null) {
  if (configuredUserId) {
    const configuredUser = await db.user.findUnique({
      where: { id: configuredUserId },
      select: googleTokenUserSelect,
    });
    if (configuredUser) return configuredUser;
  }

  const adminMembers = await db.projectMember.findMany({
    where: {
      projectId,
      role: { in: ['OWNER', 'ADMIN'] },
    },
    include: {
      user: {
        select: googleTokenUserSelect,
      },
    },
  });

  const sorted = adminMembers.sort((a, b) => {
    const rankA = a.role === 'OWNER' ? 0 : 1;
    const rankB = b.role === 'OWNER' ? 0 : 1;
    return rankA - rankB;
  });

  return (
    sorted.find((m) => m.user.googleRefreshToken || m.user.googleAccessToken)?.user ?? null
  );
}

export async function getProjectGoogleOAuthClient(
  projectId: string,
  configuredUserId: string | null,
) {
  const user = await resolveCredentialUser(projectId, configuredUserId);
  if (!user) {
    throw new Error('尚未綁定可用的 Google 帳號，請專案管理者重新登入並儲存整合設定。');
  }

  const readyUser = hasUsableAccessToken(user) ? user : await refreshUserToken(user);
  return createOAuthClient(readyUser);
}

export async function getValidGoogleAccessTokenForUserId(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: googleTokenUserSelect,
  });
  if (!user) {
    throw new Error('User not found');
  }

  const readyUser = hasUsableAccessToken(user) ? user : await refreshUserToken(user);
  if (!readyUser.googleAccessToken) {
    throw new Error('Google token missing');
  }

  return readyUser.googleAccessToken;
}
