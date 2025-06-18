
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, parse } from 'date-fns';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { getBudgetList } from '@/lib/api'; // Mock API for now
import type { BudgetListItem } from '@/types';
import { Target, PlusCircle, TrendingUp, TrendingDown, AlertTriangle, Activity, Eye, Info, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function BudgetsPage() {
  const { token, isAuthenticated } = useAuth();
  const { t, dateFnsLocale } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();

  const [budgets, setBudgets] = useState<BudgetListItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await getBudgetList(token); // Using mock API
      setBudgets(response.budgets || []);
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
      setBudgets([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token, toast, t]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const getProgressColor = (percentage: number): string => {
    if (percentage > 100) return 'bg-red-600 dark:bg-red-500'; // Over budget
    if (percentage > 75) return 'bg-orange-500 dark:bg-orange-400';
    if (percentage > 50) return 'bg-yellow-500 dark:bg-yellow-400';
    return 'bg-green-500 dark:bg-green-400';
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="font-headline text-3xl font-bold text-foreground flex items-center">
              <Target className="mr-3 h-8 w-8 text-primary" />
              {t('budgetsTitle')}
            </h1>
            <Button disabled>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('budgetCreateNewButton')}
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="shadow-lg">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-1" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-full mt-2" /> {/* For Progress bar */}
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-28" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!budgets || budgets.length === 0) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="font-headline text-3xl font-bold text-foreground flex items-center">
              <Target className="mr-3 h-8 w-8 text-primary" />
              {t('budgetsTitle')}
            </h1>
            <Button onClick={() => router.push('/budgets/new')}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('budgetCreateNewButton')}
            </Button>
          </div>
          <Card className="text-center py-10 shadow-lg">
            <CardHeader>
              <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle>{t('budgetNoBudgetsFoundTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('budgetNoBudgetsFoundDescription')}</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-3xl font-bold text-foreground flex items-center">
            <Target className="mr-3 h-8 w-8 text-primary" />
            {t('budgetsTitle')}
          </h1>
          <Button onClick={() => router.push('/budgets/new')} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('budgetCreateNewButton')}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map(budget => {
            const remainingAmount = budget.plannedAmount - budget.actualExpenses;
            const progressPercentageSafe = budget.plannedAmount > 0 ? (budget.actualExpenses / budget.plannedAmount) * 100 : (budget.actualExpenses > 0 ? 101 : 0);
            const progressPercentage = Math.min(Math.max(progressPercentageSafe, 0), 150); // Cap at 150 for visual, but logic will use actual
            const progressColorClass = getProgressColor(progressPercentageSafe);
            
            let monthDisplay = budget.month;
            try {
                monthDisplay = format(parse(budget.month, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: dateFnsLocale });
            } catch (e) {
                // Keep original if parsing fails
            }


            return (
              <Card key={budget.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-semibold text-foreground">{monthDisplay}</CardTitle>
                  <CardDescription>{t('budgetMonthlyOverview')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground flex items-center"><TrendingUp className="mr-1.5 h-4 w-4 text-green-500" />{t('budgetPlannedAmount')}</span>
                      <CurrencyDisplay amountInCents={budget.plannedAmount} currencyCode={budget.currencyCode} />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground flex items-center"><TrendingDown className="mr-1.5 h-4 w-4 text-red-500" />{t('budgetActualExpenses')}</span>
                      <CurrencyDisplay amountInCents={budget.actualExpenses} currencyCode={budget.currencyCode} />
                    </div>
                    <div className={cn("flex justify-between items-center text-sm font-medium", remainingAmount < 0 ? "text-red-600 dark:text-red-500" : "text-green-600 dark:text-green-500")}>
                      <span className="flex items-center"><Activity className="mr-1.5 h-4 w-4" />{t('budgetRemainingAmount')}</span>
                      <CurrencyDisplay amountInCents={remainingAmount} currencyCode={budget.currencyCode} />
                    </div>
                  </div>
                  <div className="pt-2">
                    <Label htmlFor={`progress-${budget.id}`} className="text-xs text-muted-foreground mb-1 block">
                      {t('budgetProgress', { percentage: progressPercentageSafe.toFixed(0) })}
                    </Label>
                    <Progress
                      id={`progress-${budget.id}`}
                      value={progressPercentageSafe > 100 ? 100 : progressPercentageSafe} // Visual cap at 100 for progress bar display
                      indicatorClassName={progressColorClass}
                      aria-label={t('budgetProgress', { percentage: progressPercentageSafe.toFixed(0) })}
                    />
                     {progressPercentageSafe > 100 && (
                      <p className="text-xs text-red-600 dark:text-red-500 mt-1 text-right">
                        {t('budgetOverspentWarning')}
                      </p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" onClick={() => router.push(`/budgets/${budget.id}`)}>
                    <Eye className="mr-2 h-4 w-4" />
                    {t('budgetShowDetailsButton')}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
