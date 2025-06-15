
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/context/i18n-context';

export default function HomePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = React.useState(true); // Local loader

  useEffect(() => {
    setIsLoading(true); 
    router.replace('/dashboard');
    // setIsLoading(false) will effectively be handled by the browser once redirection completes
    // or the target page can manage its own loading state.
  }, [router]);

  if (isLoading) {
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

