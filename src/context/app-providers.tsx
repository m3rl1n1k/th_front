
"use client";

import React, { ReactNode, Suspense } from 'react';
import { AuthProvider } from './auth-context';
import { I18nProvider } from './i18n-context';
import { GlobalLoaderProvider } from './global-loader-context';
import { NavigationEvents } from '@/hooks/use-navigation-events';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider> {/* I18nProvider now outermost of these three */}
      <GlobalLoaderProvider> {/* GlobalLoaderProvider is inside I18n, can use useTranslation() */}
        <AuthProvider> {/* AuthProvider is inside both, can use useGlobalLoader() and useTranslation() */}
          {children}
          <Suspense fallback={null}>
            <NavigationEvents />
          </Suspense>
        </AuthProvider>
      </GlobalLoaderProvider>
    </I18nProvider>
  );
}
