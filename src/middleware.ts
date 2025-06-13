
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isAuthenticated } from './lib/auth'; // Using relative path

const PUBLIC_PATHS = ['/login']; 

export async function middleware(request: NextRequest) {
  const isAuth = await isAuthenticated(); // This will always be true with auth disabled
  const { pathname, locale: detectedLocale } = request.nextUrl;

  // Ensure a fallback for locale if Next.js doesn't detect one (should be rare with 'always' prefix)
  const currentLocale = detectedLocale || 'en'; // Default to 'en'

  const isPublicPath = PUBLIC_PATHS.some(p => pathname === `/${currentLocale}${p}` || pathname === p);

  // If auth is "disabled" (always true), trying to access login page should redirect to dashboard
  if (isAuth && isPublicPath) {
    return NextResponse.redirect(new URL(`/${currentLocale}/dashboard`, request.url));
  }

  // Since auth is disabled, we don't need to redirect non-authenticated users from protected routes.
  // The original logic for redirecting unauthenticated users is effectively bypassed.

  // If user directly accesses a path without locale, Next.js i18n will handle redirection first.
  // Example: /dashboard -> /en/dashboard.
  // If locale is missing from a path that is not root, and it's not a Next.js internal path.
  if (!pathname.startsWith(`/${currentLocale}/`) && currentLocale && pathname !== '/' && !pathname.startsWith('/_next/') && !pathname.includes('.')) {
     // This case might be less relevant when default locale redirect is 'always'
     // but can catch direct non-locale prefixed app paths.
     // This ensures that accessing `/dashboard` redirects to `/[locale]/dashboard` 
     // which then correctly loads the page.
     if (!isPublicPath) { // only redirect if it's not a public path like /login
        // return NextResponse.redirect(new URL(`/${currentLocale}${pathname}`, request.url));
        // The above line might cause redirect loops with some i18n configs.
        // Let Next.js handle the primary locale redirection.
     }
  }


  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|placehold.co).*)',
  ],
};

