
"use client";

import React from 'react';
import Link from 'next/link';
import { DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
// import { useTheme } from 'next-themes'; // Removed useTheme
import { useTranslation } from '@/context/i18n-context';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  // const { theme, setTheme, resolvedTheme } = useTheme(); // Removed theme variables
  const [mounted, setMounted] = React.useState(false);
  const { t } = useTranslation();

  React.useEffect(() => setMounted(true), []);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-accent/10">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <DollarSign className="h-8 w-8 text-primary" />
            <span className="font-headline text-2xl font-bold text-foreground">{t('appName')}</span>
          </Link>
          <div className="flex items-center space-x-2">
            {/* Theme switcher button removed */}
             <Button variant="ghost" asChild>
                <Link href="/login">{t('loginButtonNav')}</Link>
            </Button>
            <Button variant="default" asChild>
                <Link href="/register">{t('registerButtonNav')}</Link>
            </Button>
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
