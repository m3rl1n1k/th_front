import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isAuthenticated } from './lib/auth'; 

const PUBLIC_PATHS = ['/login']; // Add any other public paths, locale will be prefixed by Next.js

export async function middleware(request: NextRequest) {
  const isAuth = await isAuthenticated();
  const { pathname, locale } = request.nextUrl;

  // Construct locale-prefixed paths for comparison
  const isPublicPath = PUBLIC_PATHS.some(p => pathname === `/${locale}${p}` || pathname === p);


  // If trying to access auth page (e.g., /en/login) while logged in, redirect to dashboard
  if (isAuth && isPublicPath) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  // If trying to access app page while not logged in, redirect to login
  // Exclude Next.js specific paths and API routes.
  // Root path '/' will be handled by Next.js i18n for locale redirection.
  if (!isAuth && !isPublicPath && pathname !== `/${locale}` && pathname !== '/') {
    if (pathname.startsWith('/_next/') || pathname.startsWith('/api/') || pathname.includes('.')) {
        return NextResponse.next();
    }
    // If accessing a path like /dashboard directly without locale, Next.js i18n should handle it first.
    // This check is for paths like /en/dashboard when not authenticated.
    if (pathname.startsWith(`/${locale}/`)) {
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - placehold.co (placeholder images)
     * This ensures Next.js i18n routing runs first.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|placehold.co).*)',
  ],
};
