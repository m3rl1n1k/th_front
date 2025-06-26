
"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { format, parse } from 'date-fns';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { getBudgetList, deleteBudgetsForMonth } from '@/lib/api'; 
import type { BudgetListApiResponse, MonthlyBudgetSummary as ApiMonthlyBudget, ApiError } from '@/types';
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
  const { user, token, isAuthenticated } = useAuth();
  const { t, dateFnsLocale } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();

  const [monthlyBudgets, setMonthlyBudgets] = useState<ProcessedMonthlyBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDeleteDetails, setItemToDeleteDetails] = useState<ItemToDeleteDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isFetchingRef = useRef(false);


  const fetchBudgets = useCallback(async (showLoadingIndicator = true) => {
    if (isFetchingRef.current && showLoadingIndicator) { 
      return;
    }

    if (!isAuthenticated || !token) {
      setMonthlyBudgets([]);
      if (showLoadingIndicator) setIsLoading(false);
      return;
    }
    
    isFetchingRef.current = true;
    if (showLoadingIndicator) {
      setIsLoading(true);
    }
    try {
      const response: BudgetListApiResponse = await getBudgetList(token);
      const processed: ProcessedMonthlyBudget[] = Object.entries(response.budgets || {}).map(([monthYear, data]) => {
        let monthDisplayName = monthYear;
        try {
          const parsedDate = parse(monthYear, 'yyyy-MM', new Date());
          monthDisplayName = format(parsedDate, 'MMMM yyyy', { locale: dateFnsLocale });
        } catch (e) {
          // Could not parse monthYear, using it directly.
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
    } catch (error: any) {
      if ((error as ApiError).code !== 401) {
        toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
      }
      setMonthlyBudgets([]);
    } finally {
      if (showLoadingIndicator) setIsLoading(false); 
      isFetchingRef.current = false;
    }
  }, [isAuthenticated, token, toast, t, dateFnsLocale]);

  useEffect(() => {
    if (isAuthenticated && token) {
        fetchBudgets();
    } else if (!isAuthenticated && !token) { 
        setIsLoading(false); 
        setMonthlyBudgets([]); 
    }
  }, [isAuthenticated, token, fetchBudgets]);


  const { groupedBudgetsByYear, sortedYears } = useMemo(() => {
    if (!Array.isArray(monthlyBudgets)) {
      return { groupedBudgetsByYear: {}, sortedYears: [] };
    }

    const groups: GroupedProcessedBudgets = monthlyBudgets.reduce((acc, budget) => {
      if (!budget || typeof budget.year !== 'string') {
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
    return { groupedBudgetsByYear: groups, sortedYears: sYears };
  }, [monthlyBudgets]);

  const getProgressColor = (percentage: number): string => {
    if (percentage > 100) return 'bg-red-600 dark:bg-red-500';
    if (percentage > 75) return 'bg-orange-500 dark:bg-orange-400';
    if (percentage > 50) return 'bg-yellow-500 dark:bg-yellow-400';
    return 'bg-green-500 dark:bg-green-400';
  };

  const handleViewDetails = (monthYear: string) => {
    router.push(`/budgets/summary/${monthYear}`);
  };

  const handleRemoveClick = (budget: ProcessedMonthlyBudget) => {
    setItemToDeleteDetails({ monthYear: budget.monthYear, monthDisplayName: budget.monthDisplayName });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!itemToDeleteDetails || !token) return;
    setIsDeleting(true);
    try {
      await deleteBudgetsForMonth(itemToDeleteDetails.monthYear, token); 
      toast({
        title: t('monthBudgetsDeletedTitle'),
        description: t('monthBudgetsDeletedDesc', { month: itemToDeleteDetails.monthDisplayName }),
      });
      fetchBudgets(false); 
    } catch (error: any) {
      if ((error as ApiError).code !== 401) {
        toast({
          variant: "destructive",
          title: t('errorDeletingMonthBudgets'),
          description: error.message || t('unexpectedError'),
        });
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setItemToDeleteDetails(null);
    }
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
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                    {[1,2,3,4,5].map(j => (
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

  if (monthlyBudgets.length === 0) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="font-headline text-3xl font-bold text-foreground flex items-center">
              <Target className="mr-3 h-8 w-8 text-primary" />
              {t('budgetsTitle')}
            </h1>
            <Button onClick={() => router.push('/budgets/new')} className="hidden sm:inline-flex">
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
              <Button onClick={() => router.push('/budgets/new')} className="mt-4 sm:hidden">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('budgetCreateNewButton')}
              </Button>
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
            <AccordionItem value={year} key={year} className="bg-card shadow-md rounded-lg">
              <AccordionTrigger className="px-4 py-3 text-lg font-semibold hover:bg-muted/50 rounded-t-lg hover:no-underline data-[state=open]:border-b">
                {t('yearLabel', { year: year })}
              </AccordionTrigger>
              <AccordionContent className="p-4">
                {groupedBudgetsByYear[year] && groupedBudgetsByYear[year].length > 0 ? (
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
                    {groupedBudgetsByYear[year].map(budget => {
                      const remainingAmount = budget.totalPlanned - budget.totalActual;
                      const progressPercentageSafe = budget.totalPlanned > 0 ? (budget.totalActual / budget.totalPlanned) * 100 : (budget.totalActual > 0 ? 101 : 0);
                      const progressColorClass = getProgressColor(progressPercentageSafe);
                      const monthNameOnly = budget.monthDisplayName.split(' ')[0];

                      return (
                        <Card key={budget.monthYear} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card/80 dark:bg-card/50 border hover:border-primary/50 p-3">
                          <CardHeader className="p-0 pb-2 border-b mb-2">
                            <CardTitle className="text-base font-semibold text-foreground">{monthNameOnly}</CardTitle>
                            <CardDescription className="text-xs">{budget.year}</CardDescription>
                          </CardHeader>
                          <CardContent className="p-0 space-y-1.5 flex-grow">
                            <div>
                              <div className="flex justify-between items-baseline mb-0.5">
                                <span className="text-xs text-muted-foreground">{t('budgetProgress', { percentage: progressPercentageSafe.toFixed(0) })}</span>
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
                                className="h-1.5"
                              />
                            </div>

                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground flex items-center"><TrendingUp className="mr-1 h-3 w-3 text-green-500" />{t('budgetTotalPlannedShort')}</span>
                                  <span className="font-semibold text-foreground"><CurrencyDisplay amountInCents={budget.totalPlanned} currencyCode={budget.currencyCode} /></span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground flex items-center"><TrendingDown className="mr-1 h-3 w-3 text-red-500" />{t('budgetTotalActualShort')}</span>
                                  <span className="font-semibold text-red-600 dark:text-red-400"><CurrencyDisplay amountInCents={budget.totalActual} currencyCode={budget.currencyCode} /></span>
                                </div>
                            </div>
                             <div className={cn(
                                "w-full text-center p-1.5 rounded-md font-semibold mt-1.5 text-xs",
                                remainingAmount >= 0 ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400"
                              )}>
                                <p className="text-xs uppercase tracking-wider opacity-80 mb-0.5">{t('budgetRemainingAmountShort')}</p>
                                <CurrencyDisplay amountInCents={remainingAmount} currencyCode={budget.currencyCode} />
                              </div>
                          </CardContent>
                           <CardFooter className="p-0 pt-2 border-t mt-2 flex justify-end gap-1.5">
                                <Button variant="outline" size="sm" onClick={() => handleViewDetails(budget.monthYear)} title={t('viewTransactionsForMonth', {month: budget.monthDisplayName })} className="h-7 px-2 py-1 text-xs">
                                    <Eye className="mr-1 h-3 w-3" />
                                    {t('detailsAction')}
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleRemoveClick(budget)} title={t('deleteAllMonthBudgetsConfirmTitle', {month: budget.monthDisplayName })} className="h-7 px-2 py-1 text-xs">
                                    <Trash2 className="mr-1 h-3 w-3" />
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
            <AlertDialogTitle>{t('deleteAllMonthBudgetsConfirmTitle', { month: itemToDeleteDetails?.monthDisplayName || '' })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteAllMonthBudgetsConfirmMessage', { month: itemToDeleteDetails?.monthDisplayName || '' })}
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
