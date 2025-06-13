
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator } from 'lucide-react'; 

interface AverageExpenseCardProps {
  avgDaily: number;
  avgWeekly: number;
  avgMonthly: number;
  locale: string;
  translations: {
    averageSpendingTitle?: string;
    dailyLabel?: string;
    weeklyLabel?: string;
    monthlyLabel?: string;
  };
  localStorageKey: string;
  initialVisible: boolean;
}

export function AverageExpenseCard({
  avgDaily,
  avgWeekly,
  avgMonthly,
  locale,
  translations,
  localStorageKey,
  initialVisible,
}: AverageExpenseCardProps) {
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

  const formatCurrency = (amount: number) => {
    return Number(amount).toLocaleString(locale, {
      style: 'currency',
      currency: 'USD', 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {translations.averageSpendingTitle || 'Average Spending'}
        </CardTitle>
        <Calculator className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{translations.dailyLabel || 'Daily'}</span>
            <span className="font-semibold text-sm">{formatCurrency(avgDaily)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{translations.weeklyLabel || 'Weekly'}</span>
            <span className="font-semibold text-sm">{formatCurrency(avgWeekly)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{translations.monthlyLabel || 'Monthly'}</span>
            <span className="font-semibold text-sm">{formatCurrency(avgMonthly)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
