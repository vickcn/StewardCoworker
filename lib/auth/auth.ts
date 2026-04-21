import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { db } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      // Upsert platform user record on every sign-in
      await db.user.upsert({
        where: { email: user.email },
        update: { name: user.name ?? null, image: user.image ?? null },
        create: { email: user.email, name: user.name ?? null, image: user.image ?? null },
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
