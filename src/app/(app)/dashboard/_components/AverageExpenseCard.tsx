
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator } from 'lucide-react'; // Or another suitable icon

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
}

export function AverageExpenseCard({
  avgDaily,
  avgWeekly,
  avgMonthly,
  locale,
  translations,
}: AverageExpenseCardProps) {
  const formatCurrency = (amount: number) => {
    // Assuming USD for dashboard summary, make dynamic if primary currency is available
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
