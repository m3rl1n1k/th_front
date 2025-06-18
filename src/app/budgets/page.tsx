
"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, parse, lastDayOfMonth } from 'date-fns';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { getBudgetList } from '@/lib/api';
import type { BudgetListApiResponse, MonthlyBudgetSummary as ApiMonthlyBudget } from '@/types';
import { Target, PlusCircle, TrendingUp, TrendingDown, Loader2, BarChartHorizontalBig, Eye, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

interface ItemToDeleteDetails {
  monthYear: string;
  monthDisplayName: string;
}


export default function BudgetsPage() {
  const { token, isAuthenticated } = useAuth();
  const { t, dateFnsLocale } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();

  const [monthlyBudgets, setMonthlyBudgets] = useState<ProcessedMonthlyBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDeleteDetails, setItemToDeleteDetails] = useState<ItemToDeleteDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isFetchingRef = useRef(false);


  const fetchBudgets = useCallback(async () => {
    console.log("[BudgetPage] fetchBudgets called. isFetchingRef.current:", isFetchingRef.current, "isAuthenticated:", isAuthenticated, "token:", !!token);
    if (isFetchingRef.current) {
      console.log("[BudgetPage] fetchBudgets: Aborted, already fetching.");
      return;
    }

    if (!isAuthenticated || !token) {
      console.log("[BudgetPage] fetchBudgets: Aborted, not authenticated or no token.");
      setMonthlyBudgets([]);
      setIsLoading(false);
      return;
    }
    
    isFetchingRef.current = true;
    setIsLoading(true);
    console.log("[BudgetPage] fetchBudgets: Starting fetch. setIsLoading(true), isFetchingRef.current = true.");
    try {
      const response: BudgetListApiResponse = await getBudgetList(token);
      console.log("[BudgetPage] fetchBudgets: API response received:", response);
      const processed: ProcessedMonthlyBudget[] = Object.entries(response.budgets || {}).map(([monthYear, data]) => {
        let monthDisplayName = monthYear;
        try {
          const parsedDate = parse(monthYear, 'yyyy-MM', new Date());
          monthDisplayName = format(parsedDate, 'MMMM yyyy', { locale: dateFnsLocale });
        } catch (e) {
          console.warn(`[BudgetPage] Could not parse monthYear: ${monthYear}, using it directly.`);
        }
        return {
          monthYear,
          monthDisplayName,
          year: monthYear.substring(0, 4),
          totalPlanned: data.totalPlanned.amount,
          totalActual: data.totalActual.amount,
          currencyCode: data.totalPlanned.currency.code,
        };
      }).sort((a, b) => b.monthYear.localeCompare(a.monthYear));

      setMonthlyBudgets(processed);
      console.log("[BudgetPage] fetchBudgets: Processed and set monthly budgets.");
    } catch (error: any) {
      console.error("[BudgetPage] fetchBudgets: Error fetching data:", error);
      toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
      setMonthlyBudgets([]);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
      console.log("[BudgetPage] fetchBudgets: Fetch finished. setIsLoading(false), isFetchingRef.current = false.");
    }
  }, [isAuthenticated, token, toast, t, dateFnsLocale]);

  useEffect(() => {
    console.log("[BudgetPage] useEffect for fetchBudgets triggered. Deps: isAuthenticated:", isAuthenticated, "token:", !!token, "isLoading:", isLoading);
    if (isAuthenticated && token) {
        console.log("[BudgetPage] useEffect: Conditions met, calling fetchBudgets.");
        fetchBudgets();
    } else if (!isAuthenticated && !token && isLoading) { 
        console.log("[BudgetPage] useEffect: Not authenticated, setting isLoading to false and clearing budgets.");
        setIsLoading(false);
        setMonthlyBudgets([]);
    } else {
        console.log("[BudgetPage] useEffect: Conditions not met for fetch, or already handled. isLoading:", isLoading);
        if (!isAuthenticated || !token) { // Ensure loader stops if auth disappears
            setIsLoading(false);
            setMonthlyBudgets([]);
        }
    }
  }, [isAuthenticated, token, fetchBudgets, isLoading]); // isLoading is included to re-evaluate if it changes


  const { groupedBudgetsByYear, sortedYears } = useMemo(() => {
    if (!Array.isArray(monthlyBudgets)) {
      console.log("[BudgetPage] useMemo groupedBudgets: monthlyBudgets is not an array, returning empty.", monthlyBudgets);
      return { groupedBudgetsByYear: {}, sortedYears: [] };
    }
    console.log("[BudgetPage] useMemo groupedBudgets: Processing monthlyBudgets array.", monthlyBudgets);

    const groups: GroupedProcessedBudgets = monthlyBudgets.reduce((acc, budget) => {
      if (!budget || typeof budget.year !== 'string') {
        console.warn('[BudgetPage] useMemo groupedBudgets: Invalid budget item or budget.year in reduce. Item:', budget);
        return acc;
      }
      const year = budget.year;
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(budget);
      return acc;
    }, {} as GroupedProcessedBudgets);

    const sYears = Object.keys(groups).sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
    console.log("[BudgetPage] useMemo groupedBudgets: Finished processing. Sorted years:", sYears);
    return { groupedBudgetsByYear: groups, sortedYears: sYears };
  }, [monthlyBudgets]);

  const getProgressColor = (percentage: number): string => {
    if (percentage > 100) return 'bg-red-600 dark:bg-red-500';
    if (percentage > 75) return 'bg-orange-500 dark:bg-orange-400';
    if (percentage > 50) return 'bg-yellow-500 dark:bg-yellow-400';
    return 'bg-green-500 dark:bg-green-400';
  };

  const handleViewDetails = (monthYear: string) => {
    const startDate = format(parse(monthYear, 'yyyy-MM', new Date()), 'yyyy-MM-dd');
    const endDate = format(lastDayOfMonth(parse(monthYear, 'yyyy-MM', new Date())), 'yyyy-MM-dd');
    router.push(`/transactions?startDate=${startDate}&endDate=${endDate}`);
  };

  const handleRemoveClick = (budget: ProcessedMonthlyBudget) => {
    setItemToDeleteDetails({ monthYear: budget.monthYear, monthDisplayName: budget.monthDisplayName });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!itemToDeleteDetails) return;
    setIsDeleting(true);
    toast({
      title: t('removeBudgetSummaryNotSupportedTitle'),
      description: t('removeBudgetSummaryNotSupportedDesc', { month: itemToDeleteDetails.monthDisplayName }),
      variant: "default"
    });
    setIsDeleting(false);
    setShowDeleteDialog(false);
    setItemToDeleteDetails(null);
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
                        <Skeleton key={j} className="h-48 w-full rounded-md" />
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

  if (!Array.isArray(monthlyBudgets) || monthlyBudgets.length === 0) {
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

                      const monthNameOnly = budget.monthDisplayName.split(' ')[0];

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
                             <div className={cn(
                                "w-full text-center p-2.5 rounded-md font-semibold mt-3",
                                remainingAmount >= 0 ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400"
                              )}>
                                <p className="text-xs uppercase tracking-wider opacity-80 mb-0.5">{t('budgetRemainingAmountShort')}</p>
                                <CurrencyDisplay amountInCents={remainingAmount} currencyCode={budget.currencyCode} />
                              </div>
                          </CardContent>
                           <CardFooter className="p-3 border-t mt-auto flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleViewDetails(budget.monthYear)} title={t('viewTransactionsForMonth', {month: budget.monthDisplayName })}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    {t('detailsAction')}
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleRemoveClick(budget)} title={t('removeBudgetSummaryTitle', {month: budget.monthDisplayName })}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t('removeAction')}
                                </Button>
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
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('removeBudgetSummaryTitle', { month: itemToDeleteDetails?.monthDisplayName || '' })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('removeBudgetSummaryMessage', { month: itemToDeleteDetails?.monthDisplayName || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDeleteDetails(null)}>{t('cancelButton')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? t('deleting') : t('deleteButtonConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
