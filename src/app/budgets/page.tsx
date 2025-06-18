
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { getBudgetList } from '@/lib/api';
import type { BudgetListItem } from '@/types';
import { Target, PlusCircle, TrendingUp, TrendingDown, AlertTriangle, Activity, Eye, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface GroupedBudgets {
  [year: string]: BudgetListItem[];
}

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
      const response = await getBudgetList(token);
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

  const { groupedBudgetsByYear, sortedYears } = useMemo(() => {
    if (!budgets) return { groupedBudgetsByYear: {}, sortedYears: [] };

    const groups: GroupedBudgets = budgets.reduce((acc, budget) => {
      const year = budget.month.substring(0, 4); // "2024-08" -> "2024"
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(budget);
      return acc;
    }, {} as GroupedBudgets);

    // Sort budgets within each year by month (ascending)
    for (const year in groups) {
      groups[year].sort((a, b) => {
        const monthA = parseInt(a.month.substring(5, 7), 10);
        const monthB = parseInt(b.month.substring(5, 7), 10);
        return monthA - monthB;
      });
    }

    // Sort years in descending order
    const sYears = Object.keys(groups).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
    return { groupedBudgetsByYear: groups, sortedYears: sYears };
  }, [budgets]);

  const getProgressColor = (percentage: number): string => {
    if (percentage > 100) return 'bg-red-600 dark:bg-red-500';
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
          {/* Simplified skeleton for accordion list */}
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Card key={i} className="shadow-md rounded-lg">
                <CardHeader className="p-4">
                  <Skeleton className="h-6 w-1/4 mb-1" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1,2,3].map(j => (
                        <Skeleton key={j} className="h-28 w-full rounded-md" />
                    ))}
                  </div>
                </CardContent>
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

        <Accordion type="multiple" defaultValue={sortedYears.length > 0 ? [sortedYears[0]] : []} className="w-full space-y-4">
          {sortedYears.map(year => (
            <AccordionItem value={year} key={year} className="border bg-card shadow-md rounded-lg">
              <AccordionTrigger className="px-4 py-3 text-lg font-semibold hover:bg-muted/50 rounded-t-lg hover:no-underline data-[state=open]:border-b">
                {t('yearLabel', { year: year })}
              </AccordionTrigger>
              <AccordionContent className="p-4">
                {groupedBudgetsByYear[year] && groupedBudgetsByYear[year].length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groupedBudgetsByYear[year].map(budget => {
                      const remainingAmount = budget.plannedAmount - budget.actualExpenses;
                      const progressPercentageSafe = budget.plannedAmount > 0 ? (budget.actualExpenses / budget.plannedAmount) * 100 : (budget.actualExpenses > 0 ? 101 : 0);
                      const progressColorClass = getProgressColor(progressPercentageSafe);
                      
                      let monthDisplay = budget.month;
                      try {
                          monthDisplay = format(parse(budget.month, 'yyyy-MM', new Date()), 'MMMM', { locale: dateFnsLocale });
                      } catch (e) { /* Keep original if parsing fails */ }

                      return (
                        <Card key={budget.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card/80 dark:bg-card/50">
                          <CardHeader className="p-3 flex flex-row justify-between items-center border-b">
                            <div>
                              <CardTitle className="text-md font-semibold text-foreground">{monthDisplay}</CardTitle>
                              {budget.subCategory && <CardDescription className="text-xs">{budget.subCategory.name}</CardDescription>}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/budgets/${budget.id}`)} className="px-2 py-1 h-auto">
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              {t('budgetShowDetailsButton')}
                            </Button>
                          </CardHeader>
                          <CardContent className="p-3 pt-2 space-y-2.5">
                            <div className="pt-1">
                              <Label htmlFor={`progress-${budget.id}-${year}`} className="text-xs text-muted-foreground mb-0.5 block">
                                {t('budgetProgress', { percentage: progressPercentageSafe.toFixed(0) })}
                              </Label>
                              <Progress
                                id={`progress-${budget.id}-${year}`}
                                value={progressPercentageSafe > 100 ? 100 : progressPercentageSafe}
                                indicatorClassName={progressColorClass}
                                aria-label={t('budgetProgress', { percentage: progressPercentageSafe.toFixed(0) })}
                                className="h-2.5"
                              />
                              {progressPercentageSafe > 100 && (
                                <p className="text-xs text-red-600 dark:text-red-500 mt-1 text-right">
                                  {t('budgetOverspentWarning')}
                                </p>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="text-center p-1.5 rounded-md bg-muted/40 dark:bg-muted/20">
                                <p className="text-muted-foreground flex items-center justify-center text-[0.65rem] uppercase tracking-wider font-medium">
                                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                                  {t('budgetPlannedAmountShort')}
                                </p>
                                <CurrencyDisplay amountInCents={budget.plannedAmount} currencyCode={budget.currency} />
                              </div>
                              <div className="text-center p-1.5 rounded-md bg-muted/40 dark:bg-muted/20">
                                <p className="text-muted-foreground flex items-center justify-center text-[0.65rem] uppercase tracking-wider font-medium">
                                  <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                                  {t('budgetActualExpensesShort')}
                                </p>
                                <span className="font-semibold text-red-600 dark:text-red-400">
                                  <CurrencyDisplay amountInCents={budget.actualExpenses} currencyCode={budget.currency} />
                                </span>
                              </div>
                              <div className={cn("text-center p-1.5 rounded-md", remainingAmount < 0 ? "bg-red-500/10 text-red-700 dark:text-red-400" : "bg-green-500/10 text-green-700 dark:text-green-400")}>
                                <p className="opacity-80 flex items-center justify-center text-[0.65rem] uppercase tracking-wider font-medium">
                                  <Activity className="mr-1 h-3 w-3" />
                                  {t('budgetRemainingAmountShort')}
                                </p>
                                <CurrencyDisplay amountInCents={remainingAmount} currencyCode={budget.currency} />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">{t('noBudgetsForYear')}</p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </MainLayout>
  );
}
