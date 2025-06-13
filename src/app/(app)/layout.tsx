
import { AppSidebar } from '@/components/layout/AppSidebar';
import React from 'react';
import { getTranslations } from '@/lib/getTranslations';

export default async function AppLayout({
  children,
  // params: { locale } // locale param removed
}: {
  children: React.ReactNode;
  // params: { locale: string }; // locale param removed
}) {
  const t = await getTranslations('en'); // Hardcode 'en' for translations
  return <AppSidebar locale="en" translations={t.sidebar}>{children}</AppSidebar>; // Pass "en" as locale
}
