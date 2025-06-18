
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format, parse } from 'date-fns';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { getBudgetSummaryForMonth, deleteBudget } from '@/lib/api';
import type { BudgetSummaryByMonthResponse, BudgetCategorySummaryItem as ApiBudgetCategorySummaryItem } from '@/types';
import { ArrowLeft, Target, TrendingUp, TrendingDown, Loader2, AlertTriangle, BarChartHorizontalBig, Shapes, Edit3, Trash2, MoreHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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


interface ProcessedCategoryBudgetDetail extends ApiBudgetCategorySummaryItem {
  id: string; 
}


export default function BudgetSummaryPage() {
  const { token, isAuthenticated } = useAuth();
  const { t, dateFnsLocale } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const monthYear = params?.date as string; // YYYY-MM

  const [categoryBudgets, setCategoryBudgets] = useState<ProcessedCategoryBudgetDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ProcessedCategoryBudgetDetail | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const fetchBudgetSummary = useCallback(async (showLoading = true) => {
    if (!monthYear || !isAuthenticated || !token) {
      if(showLoading) setIsLoading(false);
      if (!token && isAuthenticated) setError(t('tokenMissingError'));
      else if (!monthYear) setError(t('budgetSummaryInvalidDateError'));
      return;
    }

    if(showLoading) setIsLoading(true);
    setError(null);
    try {
      const response: BudgetSummaryByMonthResponse = await getBudgetSummaryForMonth(monthYear, token);
      const processedDetails: ProcessedCategoryBudgetDetail[] = Object.entries(response.categories || {}).map(([id, data]) => ({
        id, 
        ...data, 
      }));
      setCategoryBudgets(processedDetails);
    } catch (err: any) {
      setError(err.message || t('errorFetchingBudgetSummary'));
      toast({ variant: "destructive", title: t('errorFetchingBudgetSummary'), description: err.message });
    } finally {
      if(showLoading) setIsLoading(false);
    }
  }, [monthYear, isAuthenticated, token, t, toast]);

  useEffect(() => {
    fetchBudgetSummary();
  }, [fetchBudgetSummary]);

  const getProgressColor = (percentage: number): string => {
    if (percentage > 100) return 'bg-red-600 dark:bg-red-500';
    if (percentage > 75) return 'bg-orange-500 dark:bg-orange-400';
    if (percentage > 50) return 'bg-yellow-500 dark:bg-yellow-400';
    return 'bg-green-500 dark:bg-green-400';
  };

  const formattedMonthTitle = useMemo(() => {
    if (!monthYear) return t('budgetSummaryTitle');
    try {
      const parsedDate = parse(monthYear, 'yyyy-MM', new Date());
      return format(parsedDate, 'MMMM yyyy', { locale: dateFnsLocale });
    } catch {
      return monthYear; 
    }
  }, [monthYear, dateFnsLocale, t]);

  const handleEditItem = (budgetId: number) => {
    // Navigate to the new edit route: /budgets/summary/{monthYear}/{budgetId}
    router.push(`/budgets/summary/${monthYear}/${budgetId}`);
  };

  const handleRemoveItem = (item: ProcessedCategoryBudgetDetail) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete || !token) return;
    setIsDeleting(true);
    try {
      await deleteBudget(itemToDelete.budgetId, token);
      toast({ title: t('budgetItemDeletedTitle'), description: t('budgetItemDeletedDesc', { categoryName: itemToDelete.name }) });
      fetchBudgetSummary(false); 
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorDeletingBudgetItem'), description: error.message });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setItemToDelete(null);
    }
  };


  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-9 w-1/2" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="shadow-md rounded-lg p-4">
                <CardHeader className="p-0 pb-2">
                  <Skeleton className="h-6 w-3/4 mb-1" />
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-5 w-1/2" />
                </CardContent>
                <CardFooter className="p-0 pt-3 flex justify-end gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Card className="max-w-2xl mx-auto shadow-lg border-destructive">
          <CardHeader className="bg-destructive/10">
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" />
              {t('errorTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p>{error}</p>
          </CardContent>
           <CardFooter className="flex justify-end">
            <Button variant="outline" onClick={() => router.push('/budgets')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToBudgetsButton')}
            </Button>
          </CardFooter>
        </Card>
      </MainLayout>
    );
  }

  if (categoryBudgets.length === 0) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-headline text-3xl font-bold text-foreground">
              {t('budgetSummaryForMonthTitle', { monthDisplay: formattedMonthTitle })}
            </h1>
            <Button variant="outline" onClick={() => router.push('/budgets')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToBudgetsButton')}
            </Button>
          </div>
          <Card className="text-center py-10 shadow-lg">
            <CardHeader>
              <BarChartHorizontalBig className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle>{t('noBudgetDetailsFoundTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('noBudgetDetailsFoundDesc', { monthDisplay: formattedMonthTitle })}</p>
              <Button asChild className="mt-4">
                <Link href="/budgets/new">{t('budgetCreateNewButton')}</Link>
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
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-3xl font-bold text-foreground">
            {t('budgetSummaryForMonthTitle', { monthDisplay: formattedMonthTitle })}
          </h1>
          <Button variant="outline" onClick={() => router.push('/budgets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToBudgetsButton')}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categoryBudgets.map(budget => {
            const remainingAmount = budget.plannedAmount.amount - budget.actualAmount.amount;
            const progressPercentageSafe = budget.plannedAmount.amount > 0 ? (budget.actualAmount.amount / budget.plannedAmount.amount) * 100 : (budget.actualAmount.amount > 0 ? 101 : 0);
            const progressColorClass = getProgressColor(progressPercentageSafe);

            return (
              <Card key={budget.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card/80 dark:bg-card/50 border-border/50 hover:border-primary/50">
                <CardHeader className="p-4 pb-2 border-b flex-row items-center justify-between">
                  <div className="space-y-0.5">
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center">
                      <Shapes className="mr-2 h-5 w-5 text-primary" />
                      {budget.name}
                    </CardTitle>
                  </div>
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t('actions')}</span>
                      </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => handleEditItem(budget.budgetId)} className="cursor-pointer">
                          <Edit3 className="mr-2 h-4 w-4" /> {t('editAction')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleRemoveItem(budget)} className="text-destructive focus:text-destructive cursor-pointer">
                          <Trash2 className="mr-2 h-4 w-4" /> {t('removeAction')}
                      </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="p-4 space-y-2 flex-grow">
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
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-1 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center"><TrendingUp className="mr-1.5 h-4 w-4 text-green-500" />{t('budgetTotalPlannedShort')}</span>
                        <span className="font-semibold text-foreground"><CurrencyDisplay amountInCents={budget.plannedAmount.amount} currencyCode={budget.plannedAmount.currency.code} /></span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center"><TrendingDown className="mr-1.5 h-4 w-4 text-red-500" />{t('budgetTotalActualShort')}</span>
                        <span className="font-semibold text-red-600 dark:text-red-400"><CurrencyDisplay amountInCents={budget.actualAmount.amount} currencyCode={budget.actualAmount.currency.code} /></span>
                      </div>
                  </div>
                   <div className={cn(
                      "w-full text-center p-2 rounded-md font-semibold mt-2 text-sm",
                      remainingAmount >= 0 ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400"
                    )}>
                      <p className="text-xs uppercase tracking-wider opacity-80 mb-0.5">{t('budgetRemainingAmountShort')}</p>
                      <CurrencyDisplay amountInCents={remainingAmount} currencyCode={budget.plannedAmount.currency.code} />
                    </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteBudgetItemConfirmTitle', { categoryName: itemToDelete?.name || '' })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteBudgetItemConfirmMessage', { categoryName: itemToDelete?.name || '', month: formattedMonthTitle })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>{t('cancelButton')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? t('deleting') : t('deleteButtonConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}

