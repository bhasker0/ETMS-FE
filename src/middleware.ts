import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for Authentication-First Routing.
 *
 * Rules:
 * 1. Unauthenticated users visiting any protected route (including `/`)
 *    are immediately redirected to `/login` server-side with zero UI flashing.
 * 2. Authenticated users visiting `/login` or `/forgot-password`
 *    are immediately redirected to the Dashboard (`/`).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never intercept Next.js internals, static assets, chunks, CSS, or scripts
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname === '/sso.html' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Read access token from cookie
  const token = request.cookies.get('etms_access_token')?.value;
  const isAuthenticated = Boolean(token && token.trim() !== '');

  const isAuthRoute = pathname === '/login' || pathname === '/forgot-password';

  // 1. If user is authenticated and attempts to access login / forgot-password, redirect to dashboard
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. If user is unauthenticated and attempts to access protected routes (e.g. `/`, `/machines`, etc.)
  if (!isAuthRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|_next/webpack-hmr|api|favicon.ico).*)',
  ],
};
