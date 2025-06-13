
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isAuthenticated } from './lib/auth';

const PUBLIC_PATHS = ['/login'];
// No longer defining SUPPORTED_LOCALES or DEFAULT_LOCALE here for prefixing

export async function middleware(request: NextRequest) {
  const { pathname, search, hash } = request.nextUrl;

  // 1. Handle Next.js internals, API routes, and static files by passing them through
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    /\.(.*)$/.test(pathname) // Matches paths with extensions (e.g., .png, .ico)
  ) {
    return NextResponse.next();
  }

  // 2. Authentication and Authorization (no locale prefixing)
  const isAuth = await isAuthenticated(); // This is always true currently

  // Check if the current path (without locale) is a public path
  const isRequestingPublicPath = PUBLIC_PATHS.some(p => pathname === p);

  if (isAuth && isRequestingPublicPath) {
    // Authenticated user on a public path (e.g., /login), redirect to dashboard
    const dashboardUrl = new URL('/dashboard', request.url);
    dashboardUrl.search = search; // Preserve query params
    return NextResponse.redirect(dashboardUrl);
  }

  if (!isAuth && !isRequestingPublicPath && pathname !== '/login') {
    // Unauthenticated user on a protected path, redirect to login
    // This block is currently not hit due to isAuth always being true.
    const loginUrl = new URL('/login', request.url);
    loginUrl.search = search; // Preserve query params
    return NextResponse.redirect(loginUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except specific Next.js internals, API routes, and static files
    '/((?!api|_next/static|_next/image|favicon.ico|assets|sitemap.xml|robots.txt).*)',
  ],
};
