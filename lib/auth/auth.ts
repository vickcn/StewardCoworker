import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { db } from '@/lib/db';
import { env } from '@/lib/utils/env';

const GOOGLE_AUTH_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: env.googleOAuthClientId(),
      clientSecret: env.googleOAuthClientSecret(),
      authorization: {
        params: {
          scope: GOOGLE_AUTH_SCOPES.join(' '),
          access_type: 'offline',
          prompt: 'consent',
          response_type: 'code',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      const existing = await db.user.findUnique({ where: { email: user.email } });

      const nextAccessToken = typeof account?.access_token === 'string'
        ? account.access_token
        : existing?.googleAccessToken ?? null;
      const nextRefreshToken = typeof account?.refresh_token === 'string'
        ? account.refresh_token
        : existing?.googleRefreshToken ?? null;
      const nextExpiresAt = typeof account?.expires_at === 'number'
        ? account.expires_at
        : existing?.googleTokenExpiresAt ?? null;
      const nextScope = typeof account?.scope === 'string'
        ? account.scope
        : existing?.googleScope ?? null;

      await db.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name ?? null,
          image: user.image ?? null,
          googleAccessToken: nextAccessToken,
          googleRefreshToken: nextRefreshToken,
          googleTokenExpiresAt: nextExpiresAt,
          googleScope: nextScope,
        },
        create: {
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
          googleAccessToken: nextAccessToken,
          googleRefreshToken: nextRefreshToken,
          googleTokenExpiresAt: nextExpiresAt,
          googleScope: nextScope,
        },
      });
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const dbUser = await db.user.findUnique({ where: { email: session.user.email } });
        if (dbUser) {
          (session.user as typeof session.user & { id: string }).id = dbUser.id;
        }
      }
      return session;
    },
  },
  trustHost: true,
});
