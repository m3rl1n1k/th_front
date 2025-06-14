
import { AppSidebar } from '@/components/layout/AppSidebar';
import React from 'react';
import { getTranslations } from '@/lib/getTranslations';
import { cookies } from 'next/headers'; // Import cookies

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const currentLocale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const t = await getTranslations(currentLocale); 
  
  return <AppSidebar locale={currentLocale} translations={t.sidebar}>{children}</AppSidebar>;
}
