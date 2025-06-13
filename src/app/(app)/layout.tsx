import { AppSidebar } from '@/components/layout/AppSidebar';
import React from 'react';
import { getTranslations } from '@/lib/getTranslations';

export default async function AppLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const t = await getTranslations(locale);
  return <AppSidebar locale={locale} translations={t.sidebar}>{children}</AppSidebar>;
}
