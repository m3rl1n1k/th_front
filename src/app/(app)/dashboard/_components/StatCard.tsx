
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  currency?: boolean;
  dataAiHint?: string;
  locale?: string;
  localStorageKey: string;
  initialVisible: boolean;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  currency = false,
  dataAiHint,
  locale = 'en',
  localStorageKey,
  initialVisible,
}: StatCardProps) {
  const [isVisible, setIsVisible] = useState(initialVisible);

  useEffect(() => {
    const storedSetting = typeof window !== 'undefined' ? localStorage.getItem(localStorageKey) : null;
    if (storedSetting !== null) {
      setIsVisible(storedSetting === 'true');
    } else {
      setIsVisible(initialVisible); // Fallback to server-prop if nothing in localStorage
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === localStorageKey && event.newValue !== null) {
        setIsVisible(event.newValue === 'true');
      } else if (event.key === 'dashboard_settings_updated') { // General update trigger
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
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {currency
            ? Number(value).toLocaleString(locale, {
                style: 'currency',
                currency: 'USD', // TODO: Make this dynamic from user settings
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : typeof value === 'number'
            ? value.toLocaleString(locale)
            : value}
        </div>
        {dataAiHint && (
          <div className="text-xs text-muted-foreground hidden" data-ai-hint={dataAiHint}>
            Hint for AI image generation
          </div>
        )}
      </CardContent>
    </Card>
  );
}
