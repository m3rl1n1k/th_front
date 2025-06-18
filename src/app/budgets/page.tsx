
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
import type { BudgetListApiResponse, MonthlyBudgetSummary } from '@/types';
import { Target, PlusCircle, TrendingUp, TrendingDown, Activity, Loader2, BarChartHorizontalBig, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ProcessedMonthlyBudget {
  monthYear: string; // "YYYY-MM"
  monthDisplayName: string; // "June 2025" or "Червень 2025"
  year: string;
  totalPlanned: number; // in cents
  totalActual: number; // in cents
  currencyCode: string;
}

interface GroupedProcessedBudgets {
  [year: string]: ProcessedMonthlyBudget[];
}

export default function BudgetsPage() {
  const { token, isAuthenticated } = useAuth();
  const { t, dateFnsLocale } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();

  const [monthlyBudgets, setMonthlyBudgets] = useState<ProcessedMonthlyBudget[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response: BudgetListApiResponse = await getBudgetList(token);
      const processed: ProcessedMonthlyBudget[] = Object.entries(response.budgets || {}).map(([monthYear, data]) => {
        let monthDisplayName = monthYear;
        try {
          monthDisplayName = format(parse(monthYear, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: dateFnsLocale });
        } catch (e) {
          console.warn(`Could not parse monthYear: ${monthYear}`);
        }
        return {
          monthYear,
          monthDisplayName,
          year: monthYear.substring(0, 4),
          totalPlanned: data.totalPlanned.amount,
          totalActual: data.totalActual.amount,
          currencyCode: data.totalPlanned.currency.code, // Assuming currency is consistent
        };
      }).sort((a, b) => b.monthYear.localeCompare(a.monthYear)); // Sort by YYYY-MM descending

      setMonthlyBudgets(processed);
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
      setMonthlyBudgets([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token, toast, t, dateFnsLocale]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const { groupedBudgetsByYear, sortedYears } = useMemo(() => {
    if (!monthlyBudgets) return { groupedBudgetsByYear: {}, sortedYears: [] };

    const groups: GroupedProcessedBudgets = monthlyBudgets.reduce((acc, budget) => {
      if (!acc[budget.year]) {
        acc[budget.year] = [];
      }
      acc[budget.year].push(budget);
      return acc;
    }, {} as GroupedProcessedBudgets);

    // Years are already sorted if monthlyBudgets are sorted by YYYY-MM descending
    const sYears = Object.keys(groups).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
    return { groupedBudgetsByYear: groups, sortedYears: sYears };
  }, [monthlyBudgets]);

  const getProgressColor = (percentage: number): string => {
    if (percentage > 100) return 'bg-red-600 dark:bg-red-500'; // Overspent
    if (percentage > 75) return 'bg-orange-500 dark:bg-orange-400';
    if (percentage > 50) return 'bg-yellow-500 dark:bg-yellow-400';
    return 'bg-green-500 dark:bg-green-400'; // Good
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
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Card key={i} className="shadow-md rounded-lg">
                <CardHeader className="p-4">
                  <Skeleton className="h-6 w-1/4 mb-1" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1,2,3].map(j => (
                        <Skeleton key={j} className="h-40 w-full rounded-md" />
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

  if (!monthlyBudgets || monthlyBudgets.length === 0) {
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
              <BarChartHorizontalBig className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
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
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {groupedBudgetsByYear[year].map(budget => {
                      const remainingAmount = budget.totalPlanned - budget.totalActual;
                      const progressPercentageSafe = budget.totalPlanned > 0 ? (budget.totalActual / budget.totalPlanned) * 100 : (budget.totalActual > 0 ? 101 : 0);
                      const progressColorClass = getProgressColor(progressPercentageSafe);
                      
                      const monthNameOnly = format(parse(budget.monthYear, 'yyyy-MM', new Date()), 'MMMM', { locale: dateFnsLocale });

                      return (
                        <Card key={budget.monthYear} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card/80 dark:bg-card/50 border-border/50 hover:border-primary/50">
                          <CardHeader className="p-4 pb-3 border-b">
                            <CardTitle className="text-xl font-semibold text-foreground">{monthNameOnly}</CardTitle>
                            <CardDescription className="text-xs">{budget.year}</CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 space-y-3 flex-grow">
                            <div>
                              <div className="flex justify-between items-baseline mb-1">
                                <span className="text-sm text-muted-foreground">{t('budgetProgress', { percentage: progressPercentageSafe.toFixed(0) })}</span>
                                {progressPercentageSafe > 100 && (
                                  <span className="text-xs font-semibold text-red-500">
                                    {t('budgetOverspentWarning')}
                                  </span>
                                )}
                              </div>
                              <Progress
                                value={progressPercentageSafe > 100 ? 100 : progressPercentageSafe}
                                indicatorClassName={progressColorClass}
                                aria-label={t('budgetProgress', { percentage: progressPercentageSafe.toFixed(0) })}
                                className="h-3"
                              />
                            </div>
                            
                            <div className="space-y-2.5 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground flex items-center"><TrendingUp className="mr-1.5 h-4 w-4 text-green-500" />{t('budgetTotalPlannedShort')}</span>
                                  <span className="font-semibold text-foreground"><CurrencyDisplay amountInCents={budget.totalPlanned} currencyCode={budget.currencyCode} /></span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground flex items-center"><TrendingDown className="mr-1.5 h-4 w-4 text-red-500" />{t('budgetTotalActualShort')}</span>
                                  <span className="font-semibold text-red-600 dark:text-red-400"><CurrencyDisplay amountInCents={budget.totalActual} currencyCode={budget.currencyCode} /></span>
                                </div>
                            </div>
                          </CardContent>
                           <CardFooter className="p-4 pt-0 mt-auto">
                             <div className={cn(
                                "w-full text-center p-2.5 rounded-md font-semibold",
                                remainingAmount >= 0 ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400"
                              )}>
                                <p className="text-xs uppercase tracking-wider opacity-80 mb-0.5">{t('budgetRemainingAmountShort')}</p>
                                <CurrencyDisplay amountInCents={remainingAmount} currencyCode={budget.currencyCode} />
                              </div>
                           </CardFooter>
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
