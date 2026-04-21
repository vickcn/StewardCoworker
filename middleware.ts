import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const session = await auth();
  const { pathname } = req.nextUrl;

  // Platform routes require authentication
  const isPlatformRoute =
    pathname.startsWith('/projects') ||
    pathname.startsWith('/api/projects');

  if (isPlatformRoute && !session?.user) {
    const loginUrl = new URL('/api/auth/signin', req.url);
    loginUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/projects/:path*', '/api/projects/:path*'],
};
