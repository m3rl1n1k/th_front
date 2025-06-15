
"use client";

import React, { ReactNode, Suspense } from 'react';
import { AuthProvider } from './auth-context';
import { I18nProvider } from './i18n-context';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider> {/* I18nProvider now outermost of these three */}
        <AuthProvider> {/* AuthProvider is inside I18n */}
          {children}
          {/* Suspense for NavigationEvents removed as the hook is deleted */}
        </AuthProvider>
    </I18nProvider>
  );
}
