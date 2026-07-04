import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from '@/lib/auth/session';

const PUBLIC_ROUTES = new Set(['/login']);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(sessionToken);
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/admin') && session?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
