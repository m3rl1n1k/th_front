
"use client";

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { getDashboardTotalBalance, getDashboardMonthlyIncome, getDashboardMonthExpenses } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface DashboardData {
  total_balance: number;
  month_income: number;
  month_expense: number;
}

export default function DashboardPage() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoading(true);
      Promise.all([
        getDashboardTotalBalance(token),
        getDashboardMonthlyIncome(token),
        getDashboardMonthExpenses(token),
      ])
        .then(([balanceData, incomeData, expenseData]) => {
          setData({
            total_balance: balanceData.total_balance,
            month_income: incomeData.month_income,
            month_expense: expenseData.month_expense,
          });
        })
        .catch(error => {
          console.error("Failed to fetch dashboard summary data", error);
          toast({
            variant: "destructive",
            title: t('errorFetchingData'),
            description: error.message || "Could not load dashboard data.",
          });
          setData(null); // Clear data on error
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!isAuthenticated) {
      setIsLoading(false);
    }
  }, [token, isAuthenticated, t, toast]);

  const calculateAverageExpense = (monthlyExpense: number, period: 'daily' | 'weekly' | 'monthly') => {
    if (period === 'monthly') return monthlyExpense;
    if (period === 'daily') return Math.round(monthlyExpense / 30); // Approximation
    if (period === 'weekly') return Math.round(monthlyExpense / 4); // Approximation
    return 0;
  };

  const renderSkeletonCard = (title: string, icon?: React.ReactNode) => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-3/4 mb-1" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
  
  const renderErrorCard = () => (
    <Card className="col-span-1 md:col-span-3 bg-destructive/10 border-destructive text-destructive-foreground">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t('errorFetchingData')}</CardTitle>
        <AlertTriangle className="h-5 w-5 text-destructive" />
      </CardHeader>
      <CardContent>
        <p className="text-sm">{t('noDataAvailable')}</p>
      </CardContent>
    </Card>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="font-headline text-3xl font-bold text-foreground">{t('dashboard')}</h1>
        
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {renderSkeletonCard(t('totalBalance'), <Wallet className="h-5 w-5 text-primary" />)}
            {renderSkeletonCard(t('monthlyIncome'), <TrendingUp className="h-5 w-5 text-green-500" />)}
            {renderSkeletonCard(t('averageExpense'), <TrendingDown className="h-5 w-5 text-red-500" />)}
          </div>
        ) : !data ? (
           renderErrorCard()
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalBalance')}</CardTitle>
                <Wallet className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  <CurrencyDisplay amountInCents={data.total_balance} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('monthlyIncome')}</CardTitle>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  <CurrencyDisplay amountInCents={data.month_income} />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('averageExpense')}</CardTitle>
                <TrendingDown className="h-5 w-5 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('daily')}</p>
                    <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                      <CurrencyDisplay amountInCents={calculateAverageExpense(data.month_expense, 'daily')} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('weekly')}</p>
                    <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                      <CurrencyDisplay amountInCents={calculateAverageExpense(data.month_expense, 'weekly')} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('monthly')}</p>
                    <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                      <CurrencyDisplay amountInCents={calculateAverageExpense(data.month_expense, 'monthly')} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
