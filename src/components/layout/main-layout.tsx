
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/i18n-context';
import { useTheme } from 'next-themes';
import { DollarSign, LayoutDashboard, ListChecks, UserCircle, LogOut, Menu, Settings, Languages, WalletCards, Shapes, Sun, Moon, KeyRound } from 'lucide-react';

const navItems = [
  { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard, authRequired: true },
  { href: '/transactions', labelKey: 'transactions', icon: ListChecks, authRequired: true },
  { href: '/wallets', labelKey: 'walletsTitle', icon: WalletCards, authRequired: true },
  { href: '/categories', labelKey: 'categoriesTitle', icon: Shapes, authRequired: true },
  { href: '/profile', labelKey: 'profile', icon: UserCircle, authRequired: true },
  { href: '/settings', labelKey: 'settings', icon: Settings, authRequired: true },
];

// Public nav items for when user is not authenticated, shown in header of PublicLayout
// For MainLayout, if not authenticated, we redirect, so these are mainly for conceptual clarity
const publicNavItems = [
  { href: '/login', labelKey: 'loginButtonNav', icon: LogIn },
  { href: '/register', labelKey: 'registerButtonNav', icon: UserPlus },
];


export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false); 

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // If auth is resolved, not loading, and user is not authenticated,
    // and current page is not public, redirect to login.
    const publicPaths = ['/login', '/register', '/set-token', '/terms', '/']; // Home page is public
    if (!authIsLoading && !isAuthenticated && !publicPaths.includes(pathname)) {
      router.replace('/login');
    }
  }, [authIsLoading, isAuthenticated, router, pathname]);

  const handleNavLinkClick = (href: string) => {
    if (pathname === href) {
      setIsSheetOpen(false);
      return;
    }
    setIsNavigating(true); 
    router.push(href);
    // setIsSheetOpen(false); // Closing sheet handled by useEffect on pathname change
  };

  const handleLanguageChange = async (lang: string) => {
    if (language === lang) return;
    setIsNavigating(true); 
    try {
      await setLanguage(lang);
    } catch (error) {
      // Error handled by i18n context
    } finally {
       // setIsNavigating(false); // Handled by useEffect on pathname change
    }
  };
  
  // Reset navigation loader when pathname changes (navigation completes)
  useEffect(() => {
    setIsNavigating(false);
    setIsSheetOpen(false); 
  }, [pathname]);


  if (authIsLoading && !isAuthenticated) { // Only show full page loader if truly unauthenticated and loading
     return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-12 w-12 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg font-medium text-foreground">{t('loading')}</p>
          </div>
        </div>
      );
  }

  // If auth is resolved and user is not authenticated, this layout shouldn't render its content.
  // The useEffect above should handle redirection.
  // This check is a safeguard or for brief moments before redirect.
  if (!authIsLoading && !isAuthenticated) {
    return null; // Or a minimal loader / message if redirection takes time
  }
  
  const currentNavItems = isAuthenticated ? navItems : []; // Only show auth items if authenticated


  return (
    <div className="min-h-screen flex flex-col bg-background">
      {isNavigating && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
      )}
      <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            {isAuthenticated && (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden mr-2">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">{t('toggleNavigation')}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-card p-0">
                <nav className="flex flex-col p-6 space-y-2">
                  <Link href="/" className="mb-4" onClick={() => handleNavLinkClick('/')}>
                     <div className="flex items-center space-x-2">
                        <DollarSign className="h-8 w-8 text-primary" />
                        <span className="font-headline text-2xl font-bold text-foreground">{t('appName')}</span>
                      </div>
                  </Link>
                  {currentNavItems.map((item) => (
                    <Button
                      key={item.href}
                      variant={pathname === item.href ? 'secondary' : 'ghost'}
                      className="justify-start text-left"
                      onClick={() => handleNavLinkClick(item.href)}
                      aria-current={pathname === item.href ? 'page' : undefined}
                      disabled={isNavigating}
                    >
                      <item.icon className="mr-2 h-5 w-5" />
                      {t(item.labelKey as keyof ReturnType<typeof useTranslation>['translations'])}
                    </Button>
                  ))}
                   <Button
                      variant={'ghost'}
                      className="justify-start text-left"
                      onClick={() => handleNavLinkClick('/set-token')}
                      aria-current={pathname === '/set-token' ? 'page' : undefined}
                      disabled={isNavigating}
                    >
                      <KeyRound className="mr-2 h-5 w-5" />
                      {t('setTokenLink')}
                    </Button>
                </nav>
              </SheetContent>
            </Sheet>
            )}
            <Link href="/" onClick={() => handleNavLinkClick('/')} className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-primary" />
              <span className="font-headline text-2xl font-bold text-foreground">{t('appName')}</span>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                aria-label={t(resolvedTheme === 'dark' ? 'switchToLightMode' : 'switchToDarkMode')}
                disabled={isNavigating}
              >
                {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isNavigating}>
                  <Languages className="h-5 w-5" />
                  <span className="sr-only">{t('changeLanguage')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('selectLanguage')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleLanguageChange('en')} disabled={language === 'en' || isNavigating}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLanguageChange('uk')} disabled={language === 'uk' || isNavigating}>
                  Українська
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {mounted && user && isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full" disabled={isNavigating}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://placehold.co/100x100.png?text=${user.login.charAt(0).toUpperCase()}`} alt={user.login} data-ai-hint="avatar user"/>
                      <AvatarFallback>{user.login.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.login}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavLinkClick('/profile')} disabled={isNavigating}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>{t('profile')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                      setIsNavigating(true);
                      logout(); 
                  }} disabled={isNavigating}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
             {!isAuthenticated && !authIsLoading && mounted && (
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" asChild>
                        <Link href="/login">{t('loginButtonNav')}</Link>
                    </Button>
                    <Button variant="default" asChild>
                        <Link href="/register">{t('registerButtonNav')}</Link>
                    </Button>
                </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {isAuthenticated && (
          <aside className="hidden md:flex md:flex-col w-64 border-r bg-card p-4 space-y-2">
            <nav className="flex-1 space-y-1">
              {currentNavItems.map((item) => (
                <Button
                  key={item.href}
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => handleNavLinkClick(item.href)}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  disabled={isNavigating}
                >
                  <item.icon className="mr-2 h-5 w-5" />
                  {t(item.labelKey as keyof ReturnType<typeof useTranslation>['translations'])}
                </Button>
              ))}
              <Button
                  variant={pathname === '/set-token' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => handleNavLinkClick('/set-token')}
                  aria-current={pathname === '/set-token' ? 'page' : undefined}
                  disabled={isNavigating}
                >
                  <KeyRound className="mr-2 h-5 w-5" />
                  {t('setTokenLink')}
              </Button>
            </nav>
          </aside>
        )}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {/* Only render children if authenticated or if it's a public page already handled by PublicLayout */}
          {(isAuthenticated || ['/login', '/register', '/set-token', '/terms', '/'].includes(pathname)) ? children : null}
        </main>
      </div>
    </div>
  );
}
