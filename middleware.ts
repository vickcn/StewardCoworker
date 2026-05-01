import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
  });
  const { pathname } = req.nextUrl;

  // Platform routes require authentication
  const isPlatformRoute =
    pathname.startsWith('/projects') ||
    pathname.startsWith('/api/projects');

  if (isPlatformRoute && !token) {
    const loginUrl = new URL('/api/auth/signin', req.url);
    loginUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/projects/:path*', '/api/projects/:path*'],
};
