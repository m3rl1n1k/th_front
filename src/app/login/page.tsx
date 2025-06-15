
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalLoader } from '@/context/global-loader-context';
import { useTranslation } from '@/context/i18n-context';
// Removed unused imports: useState, useForm, SubmitHandler, zodResolver, z, Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, useAuth, DollarSign, Mail, Link

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { setIsLoading: setGlobalLoading } = useGlobalLoader();

  useEffect(() => {
    setGlobalLoading(true);
    router.replace('/dashboard');
    // Global loader will be turned off by NavigationEvents on the dashboard page
  }, [router, setGlobalLoading]);

  // Display a loading/redirecting message
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
