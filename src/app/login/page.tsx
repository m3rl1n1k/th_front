
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/context/i18n-context';
import { useAuth } from '@/context/auth-context'; // Import useAuth

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const auth = useAuth(); // Use the auth context
  const [isPageLoading, setIsPageLoading] = useState(true); // Local loader for this page

  useEffect(() => {
    // Wait for auth context to finish its initial loading
    if (!auth.isLoading) {
      if (auth.isAuthenticated) {
        setIsPageLoading(true); // Show loader while redirecting
        router.replace('/dashboard');
        // No need to setIsPageLoading(false) here as the component will unmount
      } else {
        // Not authenticated, stay on login page, hide page loader
        setIsPageLoading(false);
      }
    } else {
      // Auth is still loading its state, keep page loader active
      setIsPageLoading(true);
    }
  }, [auth.isLoading, auth.isAuthenticated, router]);

  // Display a loading/redirecting message if page is loading
  if (isPageLoading) {
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

  // If not loading and not authenticated, render the actual login form content
  // For this example, we redirect to set-token if not authenticated to allow manual token entry
  // In a real app, this would be the actual login form.
  // Since this page is effectively a redirector or placeholder if auth fails,
  // we might want to redirect to /set-token or show the actual login form (which isn't built yet).
  // For now, if it reaches here, it means user is not authenticated and should see the login page.
  // Since the FinanceFlow app's login page redirects to set-token, we do that here.
  if (!auth.isAuthenticated && !auth.isLoading) {
     router.replace('/set-token'); // Or render actual login form
     return null; // Or loading indicator for the brief moment of redirection
  }
  
  return null; // Fallback, ideally should not be reached if logic above is sound
}
