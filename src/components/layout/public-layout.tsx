
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DollarSign, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from '@/context/i18n-context';
import { usePathname } from 'next/navigation';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { t, language, setLanguage } = useTranslation();
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false); // For language change loading state

  useEffect(() => setMounted(true), []);

  const handleLanguageChange = async (lang: string) => {
    if (language === lang) return;
    setIsNavigating(true);
    try {
      await setLanguage(lang);
    } catch (error) {
      console.error("Error changing language:", error);
      // Optionally, show a toast message here if language change fails
    } finally {
      setIsNavigating(false);
    }
  };


  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-accent/10">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <DollarSign className="h-8 w-8 text-primary" />
            <span className="font-headline text-2xl font-bold text-foreground">{t('appName')}</span>
          </Link>
          <div className="flex items-center space-x-2">
            {mounted && (
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
            )}
            {pathname === '/login' && (
              <Button variant="default" asChild disabled={isNavigating} className="hidden sm:inline-flex">
                <Link href="/register">{t('registerButtonNav')}</Link>
              </Button>
            )}
            {pathname === '/register' && (
              <Button variant="default" asChild disabled={isNavigating}>
                <Link href="/login">{t('loginButtonNav')}</Link>
              </Button>
            )}
            {pathname !== '/login' && pathname !== '/register' && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
                <Button variant="ghost" asChild className="w-full sm:w-auto" disabled={isNavigating}>
                  <Link href="/login">{t('loginButtonNav')}</Link>
                </Button>
                <Button variant="default" asChild className="w-full sm:w-auto hidden sm:inline-flex" disabled={isNavigating}>
                  <Link href="/register">{t('registerButtonNav')}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center p-4">
        {children}
      </main>
      <footer className="py-6 md:px-8 md:py-0 bg-background/95 border-t border-border/40">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} {t('appName')}. {t('allRightsReserved')}.
          </p>
           <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              {t('termsOfServiceLink')}
            </Link>
        </div>
      </footer>
    </div>
  );
}
