import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

const allowedEditors = (process.env.ALLOWED_EDITOR_EMAILS || '')
  .split(',')
  .map((v) => v.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) return true;
      const email = auth?.user?.email?.toLowerCase();
      return !!email && allowedEditors.includes(email);
    },
    signIn({ user }) {
      const email = user.email?.toLowerCase();
      return !!email && allowedEditors.includes(email);
    },
  },
  trustHost: true,
});
