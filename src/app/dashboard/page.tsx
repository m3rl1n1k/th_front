
"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import {
  getDashboardTotalBalance,
  getDashboardMonthlyIncome,
  getDashboardMonthExpenses,
  getDashboardLastTransactions,
  getTransactionTypes,
  getDashboardChartTotalExpense,
  getBudgetList,
} from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, PieChart as PieChartIcon, ExternalLink, ListChecks, Activity, ArrowUpCircle, ArrowDownCircle, HelpCircle, Loader2, ArrowRightLeft, Target, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { MonthlyExpensesByCategoryResponse, Transaction as TransactionType, TransactionType as AppTransactionType, MonthlyBudgetSummary } from '@/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { PieChart, Pie, Cell, Sector } from "recharts"
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface DashboardSummaryData {
  total_balance: number; // in cents
  month_income: number; // in cents
  month_expense: number; // in cents
}

interface TransformedChartItem {
  categoryName: string;
  amount: number; // in cents
  color?: string;
  fill?: string;
}

interface ActiveShapeProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: TransformedChartItem;
  percent: number;
  value: number;
}

const generateCategoryTranslationKey = (name: string | undefined | null): string => {
  if (!name) return '';
  return name.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

interface ProcessedLastTransactionItem {
  id: string | number;
  icon: React.ReactElement;
  displayText: string;
  amount: number; // in cents
  currencyCode: string;
  date: string; // Formatted date
}

const DASHBOARD_LAST_TRANSACTIONS_LIMIT = 5;

export default function DashboardPage() {
  const { user, token, isAuthenticated } = useAuth();
  const { t, dateFnsLocale, language } = useTranslation();
  const { toast } = useToast();
  const [summaryData, setSummaryData] = useState<DashboardSummaryData | null>(null);
  const [expensesByCategoryData, setExpensesByCategoryData] = useState<MonthlyExpensesByCategoryResponse | null>(null);
  const [lastTransactions, setLastTransactions] = useState<TransactionType[] | null>(null);
  const [transactionTypes, setTransactionTypes] = useState<AppTransactionType[]>([]);
  const [activePieIndex, setActivePieIndex] = useState(0);
  const [currentMonthBudget, setCurrentMonthBudget] = useState<MonthlyBudgetSummary | null>(null);

  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingExpensesChart, setIsLoadingExpensesChart] = useState(true);
  const [isLoadingLastActivity, setIsLoadingLastActivity] = useState(true);
  const [isLoadingTransactionTypes, setIsLoadingTransactionTypes] = useState(true);
  const [isLoadingBudget, setIsLoadingBudget] = useState(true);

  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoadingSummary(true);
      setIsLoadingExpensesChart(true);
      setIsLoadingLastActivity(true);
      setIsLoadingTransactionTypes(true);
      setIsLoadingBudget(true);

      const limit = DASHBOARD_LAST_TRANSACTIONS_LIMIT;
      const currentMonthKey = format(new Date(), 'yyyy-MM');

      Promise.all([
        getDashboardTotalBalance(token),
        getDashboardMonthlyIncome(token),
        getDashboardMonthExpenses(token),
        getDashboardLastTransactions(token, limit),
        getTransactionTypes(token),
        getDashboardChartTotalExpense(token),
        getBudgetList(token)
      ])
        .then(([balanceData, incomeData, expenseData, lastTransactionsResp, typesData, chartData, budgetListResponse]) => {
          setSummaryData({
            total_balance: balanceData.total_balance,
            month_income: incomeData.month_income,
            month_expense: expenseData.month_expense,
          });
          setExpensesByCategoryData(chartData);
          setLastTransactions(lastTransactionsResp.last_transactions || []);
          const formattedTypes = Object.entries(typesData.types).map(([id, name]) => ({ id, name: name as string }));
          setTransactionTypes(formattedTypes);

          const budgetData = budgetListResponse.budgets[currentMonthKey];
          setCurrentMonthBudget(budgetData || null);
        })
        .catch(error => {
          toast({
            variant: "destructive",
            title: t('errorFetchingData'),
            description: error.message || t('dashboardDataLoadError'),
          });
          setSummaryData(null);
          setExpensesByCategoryData(null);
          setLastTransactions([]);
          setTransactionTypes([]);
          setCurrentMonthBudget(null);
        })
        .finally(() => {
          setIsLoadingSummary(false);
          setIsLoadingExpensesChart(false);
          setIsLoadingLastActivity(false);
          setIsLoadingTransactionTypes(false);
          setIsLoadingBudget(false);
        });

    } else if (!isAuthenticated) {
      setIsLoadingSummary(false);
      setIsLoadingExpensesChart(false);
      setIsLoadingLastActivity(false);
      setIsLoadingTransactionTypes(false);
      setIsLoadingBudget(false);
    }
  }, [token, isAuthenticated, t, toast]);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActivePieIndex(index);
  }, []);

  const transformedChartData = useMemo((): TransformedChartItem[] => {
    if (!expensesByCategoryData?.month_expense_chart) return [];
    return Object.entries(expensesByCategoryData.month_expense_chart).map(([categoryNameFromApi, data], index) => ({
      categoryName: categoryNameFromApi === 'no_category'
                    ? t('noCategory')
                    : t(generateCategoryTranslationKey(categoryNameFromApi), { defaultValue: categoryNameFromApi }),
      amount: data.amount,
      color: data.color,
      fill: data.color || `hsl(var(--chart-${(index % 5) + 1}))`,
    }));
  }, [expensesByCategoryData, t]);

  const chartConfig = useMemo((): ChartConfig => {
    if (!expensesByCategoryData?.month_expense_chart) return {} as ChartConfig;
    const config: ChartConfig = {};
    Object.entries(expensesByCategoryData.month_expense_chart).forEach(([keyFromApi, item], index) => {
      const displayName = keyFromApi === 'no_category'
                          ? t('noCategory')
                          : t(generateCategoryTranslationKey(keyFromApi), { defaultValue: keyFromApi });
      config[displayName] = {
        label: displayName,
        color: item.color || `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    });
    return config;
  }, [expensesByCategoryData, t]);

  const processedLastActivity = useMemo((): ProcessedLastTransactionItem[] | null => {
    if (!lastTransactions || isLoadingTransactionTypes) return null;

    return lastTransactions.map(tx => {
      const txTypeName = transactionTypes.find(type => type.id === String(tx.type))?.name?.toUpperCase();
      let icon;

      if (txTypeName === 'INCOME') {
        icon = <ArrowUpCircle className="h-5 w-5 text-green-500" />;
      } else if (txTypeName === 'EXPENSE') {
        icon = <ArrowDownCircle className="h-5 w-5 text-red-500" />;
      } else if (txTypeName === 'TRANSFER') {
        icon = <ArrowRightLeft className="h-5 w-5 text-blue-500" />;
      } else {
        icon = <HelpCircle className="h-5 w-5 text-muted-foreground" />;
      }

      const displayText = tx.description || t('noDescription');

      return {
        id: tx.id,
        icon: icon,
        displayText: displayText,
        amount: tx.amount.amount,
        currencyCode: tx.amount.currency.code,
        date: format(parseISO(tx.date), "PP", { locale: dateFnsLocale }),
      };
    });
  }, [lastTransactions, transactionTypes, t, dateFnsLocale, isLoadingTransactionTypes]);


  const calculateAverageExpense = (monthlyExpenseInCents: number, period: 'daily' | 'weekly' | 'monthly') => {
    if (period === 'monthly') return monthlyExpenseInCents;
    if (period === 'daily') return Math.round(monthlyExpenseInCents / 30);
    if (period === 'weekly') return Math.round(monthlyExpenseInCents / 4);
    return 0;
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage > 100) return 'bg-red-600 dark:bg-red-500';
    if (percentage > 75) return 'bg-orange-500 dark:bg-orange-400';
    if (percentage > 50) return 'bg-yellow-500 dark:bg-yellow-400';
    return 'bg-green-500 dark:bg-green-400';
  };


  const renderActiveShape = (props: ActiveShapeProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-midAngle * (Math.PI / 180));
    const cos = Math.cos(-midAngle * (Math.PI / 180));
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-semibold text-sm sm:text-base">
          {payload.categoryName}
        </text>
        <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 6} outerRadius={outerRadius + 10} fill={fill} />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="hsl(var(--foreground))" className="text-xs sm:text-sm">
           <CurrencyDisplay amountInCents={value} currencyCode={user?.userCurrency?.code} />
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="hsl(var(--muted-foreground))" className="text-xs">
          {`(${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };


  const renderSkeletonCard = (title: string, icon?: React.ReactNode, className?: string, lineCount = 2) => (
    <Card className={`shadow-lg hover:shadow-xl transition-shadow duration-300 ${className || ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-3/4 mb-1" />
        {Array.from({ length: lineCount -1 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-1/2 mt-1" />
        ))}
      </CardContent>
    </Card>
  );

  const renderErrorState = (messageKey: string, spanFull?: boolean) => (
    <Card className={`bg-destructive/10 text-destructive-foreground ${spanFull ? 'md:col-span-3 lg:col-span-2' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t('errorFetchingData')}</CardTitle>
        <AlertTriangle className="h-5 w-5 text-destructive" />
      </CardHeader>
      <CardContent>
        <p className="text-sm">{t(messageKey as any)}</p>
      </CardContent>
    </Card>
  );

  const renderCurrentMonthBudget = () => {
    if (isLoadingBudget) {
      return (
         <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
          <CardHeader>
            <Skeleton className="h-6 w-1/2 mb-1" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
           <CardFooter className="p-4">
             <Skeleton className="h-9 w-24" />
           </CardFooter>
        </Card>
      );
    }

    if (!currentMonthBudget) {
      return (
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-center items-center text-center h-full">
            <CardHeader>
                <Target className="mx-auto h-10 w-10 text-muted-foreground" />
                <CardTitle>{t('budgetNoBudgetsFoundTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{t('noCurrentMonthBudget')}</p>
                 <Button asChild variant="secondary">
                    <Link href="/budgets/new">
                        {t('budgetCreateNewButton')}
                    </Link>
                </Button>
            </CardContent>
        </Card>
      );
    }
    const { totalPlanned, totalActual, currencyCode } = {
      totalPlanned: currentMonthBudget.totalPlanned.amount,
      totalActual: currentMonthBudget.totalActual.amount,
      currencyCode: currentMonthBudget.totalPlanned.currency.code,
    };
    const remainingAmount = totalPlanned - totalActual;
    const progressPercentage = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : (totalActual > 0 ? 101 : 0);
    const progressColorClass = getProgressColor(progressPercentage);
    const currentMonthKey = format(new Date(), 'yyyy-MM');

    return (
       <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card/80 dark:bg-card/50 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-foreground">{t('monthName', { month: format(new Date(), 'MMMM', { locale: dateFnsLocale }) })}</CardTitle>
          <CardDescription className="text-sm">{format(new Date(), 'yyyy')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-grow p-4">
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-sm text-muted-foreground">{t('budgetProgress', { percentage: progressPercentage.toFixed(0) })}</span>
              {progressPercentage > 100 && (
                <span className="text-sm font-semibold text-red-500">
                  {t('budgetOverspentWarning')}
                </span>
              )}
            </div>
            <Progress
              value={progressPercentage > 100 ? 100 : progressPercentage}
              indicatorClassName={progressColorClass}
              aria-label={t('budgetProgress', { percentage: progressPercentage.toFixed(0) })}
              className="h-2"
            />
          </div>
          <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center"><TrendingUp className="mr-1.5 h-4 w-4 text-green-500" />{t('budgetTotalPlannedShort')}</span>
                <span className="font-semibold text-foreground"><CurrencyDisplay amountInCents={totalPlanned} currencyCode={currencyCode} /></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center"><TrendingDown className="mr-1.5 h-4 w-4 text-red-500" />{t('budgetTotalActualShort')}</span>
                <span className="font-semibold text-red-600 dark:text-red-400"><CurrencyDisplay amountInCents={totalActual} currencyCode={currencyCode} /></span>
              </div>
          </div>
            <div className={cn(
            "w-full text-center p-3 rounded-md font-semibold text-base sm:text-lg",
            remainingAmount >= 0 ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400"
            )}>
            <p className="text-xs sm:text-sm uppercase tracking-wider opacity-80 mb-1">{t('budgetRemainingAmountShort')}</p>
            <CurrencyDisplay amountInCents={remainingAmount} currencyCode={currencyCode} />
            </div>
        </CardContent>
          <CardFooter className="pt-3">
              <Button variant="outline" size="default" asChild className="w-full">
                <Link href={`/budgets/summary/${currentMonthKey}`}>
                    <Eye className="mr-2 h-5 w-5" />
                    {t('detailsAction')}
                </Link>
            </Button>
          </CardFooter>
      </Card>
    );
  };


  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="font-headline text-2xl sm:text-3xl font-bold text-foreground">{t('dashboard')}</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoadingSummary ? (
            <>
              {renderSkeletonCard(t('totalBalance'), <Wallet className="h-5 w-5 text-primary" />)}
              {renderSkeletonCard(t('monthlyIncome'), <TrendingUp className="h-5 w-5 text-green-500" />)}
              {renderSkeletonCard(t('averageExpense'), <TrendingDown className="h-5 w-5 text-red-500" />, '', 3)}
            </>
          ) : !summaryData ? (
            renderErrorState('dashboardDataLoadError', true)
          ) : (
            <>
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalBalance')}</CardTitle>
                  <Wallet className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-foreground">
                    <CurrencyDisplay amountInCents={summaryData.total_balance} />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t('monthlyIncome')}</CardTitle>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                    <CurrencyDisplay amountInCents={summaryData.month_income} />
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
                      <div className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400">
                        <CurrencyDisplay amountInCents={calculateAverageExpense(summaryData.month_expense, 'daily')} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('weekly')}</p>
                      <div className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400">
                        <CurrencyDisplay amountInCents={calculateAverageExpense(summaryData.month_expense, 'weekly')} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('monthly')}</p>
                      <div className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400">
                        <CurrencyDisplay amountInCents={calculateAverageExpense(summaryData.month_expense, 'monthly')} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                <div className="space-y-0.5">
                  <CardTitle className="text-xl font-semibold text-foreground">
                    {t('monthlyExpensesByCategoryChartTitle')}
                  </CardTitle>
                  {summaryData && (
                    <CardDescription>
                      {t('totalExpensesLabel')}: <CurrencyDisplay amountInCents={summaryData.month_expense} />
                    </CardDescription>
                  )}
                </div>
                <PieChartIcon className="h-6 w-6 text-primary" />
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingExpensesChart ? (
                  <div className="flex justify-center items-center h-72">
                    <Skeleton className="h-64 w-64 rounded-full" />
                  </div>
                ) : !expensesByCategoryData || transformedChartData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-72 text-center">
                      <PieChartIcon className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">{t('noDataAvailable')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('tryAddingExpenses')}
                      </p>
                      <Button variant="link" asChild className="mt-2">
                        <Link href="/transactions/new">
                          {t('addNewTransaction')} <ExternalLink className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                ) : (
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square h-[300px] sm:h-[350px]"
                  >
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                       <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent hideLabel />}
                        />
                      <Pie
                        data={transformedChartData}
                        dataKey="amount"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        innerRadius="30%"
                        strokeWidth={2}
                        activeIndex={activePieIndex}
                        activeShape={renderActiveShape}
                        onMouseEnter={onPieEnter}
                      >
                        {transformedChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} className="focus:outline-none" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                  <CardTitle className="text-xl font-semibold text-foreground">{t('lastActivityTitle')}</CardTitle>
                  <Activity className="h-6 w-6 text-primary" />
                </CardHeader>
                <CardContent className="p-6">
                  {isLoadingLastActivity || isLoadingTransactionTypes ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3 p-2">
                          <Skeleton className="h-6 w-6 rounded-md" />
                          <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                      ))}
                    </div>
                  ) : !processedLastActivity || processedLastActivity.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                      <ListChecks className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">{t('noRecentTransactions')}</p>
                      <Button variant="link" asChild className="mt-2">
                        <Link href="/transactions/new">
                          {t('addNewTransaction')} <ExternalLink className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {processedLastActivity.map((item) => (
                        <Link key={item.id} href={`/transactions/${item.id}`} className="block p-3 rounded-md hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center space-x-3 flex-shrink min-w-0">
                                    {item.icon}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate" title={item.displayText}>
                                            {item.displayText}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{item.date}</p>
                                    </div>
                                </div>
                                <div className="text-sm font-medium text-right flex-shrink-0 ml-2">
                                    <CurrencyDisplay amountInCents={item.amount} currencyCode={item.currencyCode} />
                                </div>
                            </div>
                        </Link>
                      ))}
                      {processedLastActivity.length > 0 && (
                        <Button variant="outline" asChild className="w-full mt-4">
                            <Link href="/transactions">
                                {t('viewAllTransactions')} <ExternalLink className="ml-2 h-4 w-4"/>
                            </Link>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
          </div>
          <div className="lg:col-span-1">
             {renderCurrentMonthBudget()}
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
