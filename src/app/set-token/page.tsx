
"use client";

// This page has been removed as manual token setting is a security concern.
// For authentication, please use the standard login flow.
// If you need to debug with a specific token, consider backend mechanisms
// or temporary modifications to your development environment's authentication flow.

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PublicLayout } from '@/components/layout/public-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/context/i18n-context';

export default function SetTokenPageRemoved() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    // Redirect to login page or homepage after a delay
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <PublicLayout>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle size={32} />
          </div>
          <CardTitle className="font-headline text-3xl">{t('manualTokenPageRemovedTitle')}</CardTitle>
          <CardDescription>{t('manualTokenPageRemovedDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          <p>{t('redirectingToLoginSoon')}</p>
        </CardContent>
      </Card>
    </PublicLayout>
  );
}
