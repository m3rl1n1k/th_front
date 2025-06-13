import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isAuthenticated } from './lib/auth'; // We'll use our mock auth

export async function middleware(request: NextRequest) {
  const isAuth = await isAuthenticated();
  const { pathname } = request.nextUrl;

  // If trying to access auth page while logged in, redirect to dashboard
  if (isAuth && (pathname.startsWith('/login'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If trying to access app page while not logged in, redirect to login
  if (!isAuth && !pathname.startsWith('/login') && pathname !== '/') {
     // Allow access to root path to redirect correctly, otherwise redirect to login
    if (pathname.startsWith('/_next/') || pathname.startsWith('/api/') || pathname.includes('.')) { // Allow Next.js internals and static files
        return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico|placehold.co).*)',
  ],
};
