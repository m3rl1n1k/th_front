
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/context/i18n-context';
import { useAuth } from '@/context/auth-context';

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLoading: authIsLoading, isAuthenticated } = useAuth();
  // Start with true to show loader initially, or while auth state is being determined.
  const [isProcessingLogin, setIsProcessingLogin] = useState(true); 

  useEffect(() => {
    if (!authIsLoading) {
      // Auth state is resolved
      if (isAuthenticated) {
        // Already authenticated, redirect to dashboard
        // Loader will show via isProcessingLogin (which is still true or will be set by this effect)
        router.replace('/dashboard');
      } else {
        // Not authenticated, redirect to set-token page
        router.replace('/set-token');
      }
      // In either case of redirection, we don't need to set isProcessingLogin to false,
      // as the component will unmount. If it didn't unmount, we would set it false here.
    }
    // If authIsLoading is true, we keep isProcessingLogin as true (or let it be set by default)
    // to continue showing the loader.
  }, [authIsLoading, isAuthenticated, router]);

  // This condition covers both initial auth check and the brief moment of redirection.
  if (authIsLoading || isProcessingLogin) { 
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

  // This part should ideally not be reached if redirection logic is sound and covers all cases.
  // It acts as a fallback.
  return null; 
}
