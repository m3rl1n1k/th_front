
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
import {
  LayoutDashboard, ListChecks, UserCircle, LogOut, Menu, Settings, Languages, WalletCards,
  Shapes, Sun, Moon, UserPlus, ArrowRightLeft, MessageSquare, ClipboardList, Target, Briefcase,
  BarChart3, Brain, FileSignature, Bot
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';
import { EmailVerificationBanner } from '@/components/common/email-verification-banner';

const baseNavItems = [
  { href: '/dashboard', labelKey: 'dashboard', icon: LayoutDashboard, authRequired: true },
  { href: '/transactions', labelKey: 'transactions', icon: ListChecks, authRequired: true },
  { href: '/wallets', labelKey: 'walletsTitle', icon: WalletCards, authRequired: true },
  { href: '/categories', labelKey: 'categoriesTitle', icon: Shapes, authRequired: true },
  { href: '/budgets', labelKey: 'budgetsTitle', icon: Target, authRequired: true },
  { href: '/transfers', labelKey: 'transfersTitle', icon: ArrowRightLeft, authRequired: true },
  { href: '/capital', labelKey: 'capitalMenuLabel', icon: Briefcase, authRequired: true },
];

const reportNavItems = [
  { href: '/report/ai', labelKey: 'aiReportMenu', icon: Brain, authRequired: true },
  { href: '/report/general', labelKey: 'generalReportMenu', icon: FileSignature, authRequired: true },
];

const supportNavItems = [
  { href: '/feedback', labelKey: 'feedbackPageTitle', icon: MessageSquare, authRequired: true },
  { href: '/support/chat', labelKey: 'supportChat', icon: Bot, authRequired: true },
];

const userSpecificNavItems = [
  { href: '/profile', labelKey: 'profile', icon: UserCircle, authRequired: true },
  { href: '/settings', labelKey: 'settings', icon: Settings, authRequired: true },
];

const adminNavItems = [
   { href: '/admin/feedbacks', labelKey: 'adminFeedbacksPageTitle', icon: ClipboardList, authRequired: true, requiredRole: 'ROLE_MODERATOR_FEEDBACK' }
];

const publicNavItems = [
  { href: '/login', labelKey: 'loginButtonNav', icon: LogOut },
  { href: '/register', labelKey: 'registerButtonNav', icon: UserPlus },
];

const INTENDED_DESTINATION_KEY = 'intended_destination';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated, isLoading: authIsLoading, pendingInvitationCount } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => setMounted(true), []);

  const userHasRole = useCallback((role: string): boolean => {
    return user?.roles?.includes(role) || false;
  }, [user]);

  const getNavItems = useCallback(() => {
    if (!isAuthenticated) return [];
    let items = [...baseNavItems];
    items.push(...reportNavItems); 

    adminNavItems.forEach(item => {
      if (item.requiredRole && userHasRole(item.requiredRole)) {
        items.push(item);
      }
    });

    items = [...items, ...supportNavItems, ...userSpecificNavItems];
    return items;
  }, [isAuthenticated, userHasRole]);


  useEffect(() => {
    const publicPaths = ['/login', '/register', '/terms', '/', '/set-token', '/auth/verify'];
    if (!authIsLoading && !isAuthenticated && !publicPaths.includes(pathname)) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(INTENDED_DESTINATION_KEY, pathname);
      }
      router.replace('/login');
    } else if (
        !authIsLoading &&
        isAuthenticated &&
        user &&
        (!user.userCurrency || !user.userCurrency.code) &&
        pathname !== '/profile' &&
        !publicPaths.includes(pathname)
      ) {
        toast({
          title: t('setYourCurrencyTitle'),
          description: t('setYourCurrencyDesc'),
          variant: 'default',
          duration: 7000,
        });
        router.replace('/profile');
    }
  }, [authIsLoading, isAuthenticated, user, router, pathname, t, toast]);

  const handleNavLinkClick = (href: string) => {
    if (pathname === href) {
      setIsSheetOpen(false);
      return;
    }
    setIsNavigating(true);
    router.push(href);
  };

  const handleLanguageChange = async (lang: string) => {
    if (language === lang) return;
    setIsNavigating(true);
    try {
      await setLanguage(lang);
    } catch (error) {
      // Error changing language
    } finally {
      setIsNavigating(false);
    }
  };

  useEffect(() => {
    setIsNavigating(false);
    setIsSheetOpen(false);
  }, [pathname]);


  if (authIsLoading && !mounted) {
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

  const publicPaths = ['/login', '/register', '/terms', '/', '/set-token', '/auth/verify'];
  if (!isAuthenticated && !authIsLoading && !publicPaths.includes(pathname)) {
     return null;
  }

  const currentNavItems = getNavItems();

  const renderNavGroup = (items: typeof baseNavItems, groupTitleKey?: string) => (
    <>
      {groupTitleKey && (
        <div className="px-3 py-2">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            {t(groupTitleKey as keyof ReturnType<typeof useTranslation>['translations'])}
          </h2>
        </div>
      )}
      {items.map((item) => (
        <Button
          key={item.href}
          variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => handleNavLinkClick(item.href)}
          aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
          disabled={isNavigating}
        >
          <item.icon className="mr-2 h-5 w-5" />
          <span>{t(item.labelKey as keyof ReturnType<typeof useTranslation>['translations'])}</span>
          {item.labelKey === 'capitalMenuLabel' && pendingInvitationCount > 0 && (
            <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-destructive-foreground bg-destructive rounded-full">
              {pendingInvitationCount}
            </span>
          )}
        </Button>
      ))}
    </>
  );

  const renderMobileNavGroup = (items: typeof baseNavItems, groupTitleKey?: string) => (
     <>
      {groupTitleKey && (
        <div className="px-3 pt-4 pb-1">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            {t(groupTitleKey as keyof ReturnType<typeof useTranslation>['translations'])}
          </h2>
        </div>
      )}
      {items.map((item) => (
        <Button
          key={item.href}
          variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
          className="justify-start text-left"
          onClick={() => handleNavLinkClick(item.href)}
          aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
          disabled={isNavigating}
        >
          <item.icon className="mr-2 h-5 w-5" />
          <span>{t(item.labelKey as keyof ReturnType<typeof useTranslation>['translations'])}</span>
           {item.labelKey === 'capitalMenuLabel' && pendingInvitationCount > 0 && (
            <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-destructive-foreground bg-destructive rounded-full">
              {pendingInvitationCount}
            </span>
          )}
        </Button>
      ))}
    </>
  );


  return (
    <div className="min-h-screen bg-background">
      {isNavigating && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
      )}
      <header className="sticky top-0 z-40 w-full bg-card shadow-sm">
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
              <SheetContent side="left" className="w-72 bg-card p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>
                    <Link
                      href="/"
                      onClick={(e) => {
                        if (pathname === '/') {
                          setIsSheetOpen(false);
                          e.preventDefault();
                        } else {
                          setIsNavigating(true);
                        }
                      }}
                       className="flex items-center space-x-2"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8"
                      >
                        <path
                          d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"
                          fill="currentColor"
                          className="text-primary/10"
                        />
                        <path
                          d="M7 14C7 14 9 11 12 11C15 11 17 14 17 14"
                          stroke="currentColor"
                          className="text-destructive"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M7 10C7 10 9 13 12 13C15 13 17 10 17 10"
                          stroke="currentColor"
                          className="text-primary"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="font-headline text-2xl font-bold text-foreground">{t('appName')}</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto">
                    <nav className="flex flex-col p-4 space-y-1">
                      {renderMobileNavGroup(baseNavItems)}
                      {renderMobileNavGroup(reportNavItems, 'reportsGroup')}
                      {adminNavItems.filter(item => item.requiredRole && userHasRole(item.requiredRole)).length > 0 && (
                        <div className="pt-2">
                          <Separator />
                          {renderMobileNavGroup(adminNavItems.filter(item => item.requiredRole && userHasRole(item.requiredRole)), 'Admin')}
                        </div>
                      )}
                      <div className="pt-2">
                         <Separator />
                         {renderMobileNavGroup(supportNavItems, 'supportGroup')}
                      </div>
                      <div className="pt-2">
                         <Separator />
                         {renderMobileNavGroup(userSpecificNavItems, t('profile'))}
                      </div>
                    </nav>
                </div>
              </SheetContent>
            </Sheet>
            )}
             <Link
              href="/"
              onClick={(e) => {
                 if (pathname === '/') {
                    e.preventDefault();
                 } else {
                    setIsNavigating(true);
                 }
              }}
              className="flex items-center space-x-2"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
              >
                <path
                  d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z"
                  fill="currentColor"
                  className="text-primary/10"
                />
                <path
                  d="M7 14C7 14 9 11 12 11C15 11 17 14 17 14"
                  stroke="currentColor"
                  className="text-destructive"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 10C7 10 9 13 12 13C15 13 17 10 17 10"
                  stroke="currentColor"
                  className="text-primary"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
                    {publicNavItems.map(item => (
                       <Button
                          key={item.href}
                          variant={item.href === '/register' ? 'default' : 'ghost'}
                          asChild
                          disabled={isNavigating}
                          className="w-full sm:w-auto"
                        >
                          <Link href={item.href} onClick={(e) => {if (pathname !== item.href) setIsNavigating(true); else e.preventDefault();}}>
                            {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                            {t(item.labelKey as keyof ReturnType<typeof useTranslation>["translations"])}
                          </Link>
                       </Button>
                    ))}
                </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col">
        <div className="flex flex-1">
          {isAuthenticated && (
            <aside className="fixed top-16 left-0 bottom-0 hidden md:flex md:flex-col w-64 bg-card p-4 space-y-1 z-30 h-[calc(100vh-4rem)] overflow-y-auto">
              <nav className="flex-1 space-y-1">
                {renderNavGroup(baseNavItems)}
                <Separator className="my-2" />
                {renderNavGroup(reportNavItems, 'reportsGroup')}
                {adminNavItems.filter(item => item.requiredRole && userHasRole(item.requiredRole)).length > 0 && (
                  <>
                    <Separator className="my-2" />
                    {renderNavGroup(adminNavItems.filter(item => item.requiredRole && userHasRole(item.requiredRole)), 'Admin')}
                  </>
                )}
                <Separator className="my-2" />
                {renderNavGroup(supportNavItems, 'supportGroup')}
                <Separator className="my-2" />
                {renderNavGroup(userSpecificNavItems)}
              </nav>
            </aside>
          )}
          <main className={`flex-1 overflow-auto ${isAuthenticated ? 'md:ml-64' : ''}`}>
            <div className="p-4 sm:p-6 lg:p-8">
              {isAuthenticated && <EmailVerificationBanner />}
              { (isAuthenticated && !authIsLoading) || publicPaths.includes(pathname) ? children : null }
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
