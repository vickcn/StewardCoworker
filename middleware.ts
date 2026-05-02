import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function hasSessionCookie(req: NextRequest): boolean {
  return [
    '__Secure-authjs.session-token',
    'authjs.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.session-token',
  ].some((name) => Boolean(req.cookies.get(name)?.value));
}

export async function middleware(req: NextRequest) {
  const hasSession = hasSessionCookie(req);
  const { pathname } = req.nextUrl;

  // Platform routes require authentication
  const isPlatformRoute =
    pathname.startsWith('/projects') ||
    pathname.startsWith('/api/projects');

  if (isPlatformRoute && !hasSession) {
    const loginUrl = new URL('/api/auth/signin', req.url);
    loginUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/projects/:path*', '/api/projects/:path*'],
};
