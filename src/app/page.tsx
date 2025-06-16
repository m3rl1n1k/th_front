
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/context/i18n-context';
import { useAuth } from '@/context/auth-context'; // Import useAuth

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const auth = useAuth(); // Use the auth context
  const [isPageLoading, setIsPageLoading] = useState(true); // Local loader for this page

  useEffect(() => {
    // Wait for auth context to finish its initial loading
    if (!auth.isLoading) {
      setIsPageLoading(true); // Show loader while deciding/redirecting
      if (auth.isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login'); // If not authenticated after auth check, go to login
      }
      // No need to setIsPageLoading(false) here as the component will unmount upon redirection
    } else {
      // Auth is still loading its state, keep page loader active
      setIsPageLoading(true);
    }
  }, [auth.isLoading, auth.isAuthenticated, router]);

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
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

  return null; // Or some minimal UI if needed before redirect fully occurs
}
