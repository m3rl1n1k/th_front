
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RecentActivityList } from './RecentActivityList';
import type { Transaction, Wallet, SubCategory, MainCategory } from '@/lib/definitions';

interface DashboardRecentActivitySectionProps {
  transactions: Transaction[];
  wallets: Wallet[];
  subCategories: SubCategory[];
  mainCategories: MainCategory[];
  translations: {
    recentActivity?: string;
    recentActivityDescription?: string;
    noRecentActivity?: string;
    income?: string;
    expense?: string;
  };
  localStorageKey: string;
  initialVisible: boolean;
}

export function DashboardRecentActivitySection({
  transactions,
  wallets,
  subCategories,
  mainCategories,
  translations,
  localStorageKey,
  initialVisible,
}: DashboardRecentActivitySectionProps) {
  const [isVisible, setIsVisible] = useState(initialVisible);

  useEffect(() => {
    const storedSetting = typeof window !== 'undefined' ? localStorage.getItem(localStorageKey) : null;
    if (storedSetting !== null) {
      setIsVisible(storedSetting === 'true');
    } else {
      setIsVisible(initialVisible);
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === localStorageKey && event.newValue !== null) {
        setIsVisible(event.newValue === 'true');
      } else if (event.key === 'dashboard_settings_updated') {
        const freshStoredSetting = localStorage.getItem(localStorageKey);
        if (freshStoredSetting !== null) {
          setIsVisible(freshStoredSetting === 'true');
        }
      }
    };

    if (typeof window !== 'undefined') {
        window.addEventListener('storage', handleStorageChange);
    }
    return () => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('storage', handleStorageChange);
        }
    };
  }, [localStorageKey, initialVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{translations.recentActivity}</CardTitle>
        <CardDescription>{translations.recentActivityDescription || "Latest financial movements."}</CardDescription>
      </CardHeader>
      <CardContent>
        <RecentActivityList
          transactions={transactions}
          wallets={wallets}
          subCategories={subCategories}
          mainCategories={mainCategories}
          translations={translations}
        />
      </CardContent>
    </Card>
  );
}
