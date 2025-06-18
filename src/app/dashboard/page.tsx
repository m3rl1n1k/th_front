
"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import {
  getDashboardTotalBalance,
  getDashboardMonthlyIncome,
  getDashboardMonthExpenses,
  getDashboardChartTotalExpense,
  getDashboardLastTransactions,
  getTransactionTypes // Import getTransactionTypes
} from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, PieChart as PieChartIcon, ExternalLink, ListChecks, Activity, ArrowUpCircle, ArrowDownCircle, HelpCircle, Loader2, ArrowRightLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { MonthlyExpensesByCategoryResponse, Transaction as TransactionType, TransactionType as AppTransactionType } from '@/types'; // Import AppTransactionType
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { PieChart, Pie, Cell, Legend, Sector } from "recharts"
import Link from 'next/link';
import { format, parseISO } from 'date-fns';

interface DashboardSummaryData {
  total_balance: number; // in cents
  month_income: number; // in cents
  month_expense: number; // in cents
}

interface TransformedChartItem {
  categoryName: string; // This will be the translated name or original if no translation
  amount: number; // in cents
  color?: string;
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
  value: number; // This is `amount` from payload, in cents
}

const generateCategoryTranslationKey = (name: string | undefined | null): string => {
  if (!name) return '';
  return name.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

const renderActiveShape = (props: ActiveShapeProps, currencyCode?: string, t?: Function) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="cursor-pointer transition-opacity hover:opacity-80"
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="hsl(var(--foreground))" dy={0} className="text-xs">
        {payload.categoryName}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={16} textAnchor={textAnchor} fill="hsl(var(--muted-foreground))" className="text-xs">
         <CurrencyDisplay amountInCents={value} currencyCode={currencyCode}/> {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

interface ProcessedLastTransactionItem {
  id: string | number;
  icon: React.ReactElement;
  displayText: string;
  amount: number; // in cents
  currencyCode: string;
  date: string; // Formatted date
}

const LAST_TRANSACTIONS_LIMIT_KEY = 'dashboardLastTransactionsLimit';
const DEFAULT_LAST_TRANSACTIONS_LIMIT = 10;

export default function DashboardPage() {
  const { user, token, isAuthenticated } = useAuth();
  const { t, dateFnsLocale } = useTranslation();
  const { toast } = useToast();
  const [summaryData, setSummaryData] = useState<DashboardSummaryData | null>(null);
  const [expensesByCategoryData, setExpensesByCategoryData] = useState<MonthlyExpensesByCategoryResponse | null>(null);
  const [lastTransactions, setLastTransactions] = useState<TransactionType[] | null>(null);
  const [transactionTypes, setTransactionTypes] = useState<AppTransactionType[]>([]); // State for transaction types

  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingExpensesChart, setIsLoadingExpensesChart] = useState(true);
  const [isLoadingLastActivity, setIsLoadingLastActivity] = useState(true);
  const [isLoadingTransactionTypes, setIsLoadingTransactionTypes] = useState(true); // Loading state for types

  const [activeChartIndex, setActiveChartIndex] = useState(0);

  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoadingSummary(true);
      setIsLoadingExpensesChart(true);
      setIsLoadingLastActivity(true);
      setIsLoadingTransactionTypes(true);

      let limit = DEFAULT_LAST_TRANSACTIONS_LIMIT;
      if (typeof window !== 'undefined') {
        const storedLimit = localStorage.getItem(LAST_TRANSACTIONS_LIMIT_KEY);
        if (storedLimit) {
          const parsedLimit = parseInt(storedLimit, 10);
          if (!isNaN(parsedLimit) && parsedLimit > 0) {
            limit = parsedLimit;
          }
        }
      }

      Promise.all([
        getDashboardTotalBalance(token),
        getDashboardMonthlyIncome(token),
        getDashboardMonthExpenses(token),
        getDashboardChartTotalExpense(token),
        getDashboardLastTransactions(token, limit),
        getTransactionTypes(token) // Fetch transaction types
      ])
        .then(([balanceData, incomeData, expenseData, chartDataResponse, lastTransactionsResp, typesData]) => {
          setSummaryData({
            total_balance: balanceData.total_balance,
            month_income: incomeData.month_income,
            month_expense: expenseData.month_expense,
          });
          setExpensesByCategoryData(chartDataResponse);
          setLastTransactions(lastTransactionsResp.last_transactions || []);
          const formattedTypes = Object.entries(typesData.types).map(([id, name]) => ({ id, name: name as string }));
          setTransactionTypes(formattedTypes);
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
        })
        .finally(() => {
          setIsLoadingSummary(false);
          setIsLoadingExpensesChart(false);
          setIsLoadingLastActivity(false);
          setIsLoadingTransactionTypes(false);
        });

    } else if (!isAuthenticated) {
      setIsLoadingSummary(false);
      setIsLoadingExpensesChart(false);
      setIsLoadingLastActivity(false);
      setIsLoadingTransactionTypes(false);
    }
  }, [token, isAuthenticated, t, toast]);

  const transformedChartData = useMemo((): TransformedChartItem[] => {
    if (!expensesByCategoryData?.month_expense_chart) return [];
    return Object.entries(expensesByCategoryData.month_expense_chart).map(([categoryNameFromApi, data]) => ({
      categoryName: categoryNameFromApi === 'no_category' 
                    ? t('noCategory') 
                    : t(generateCategoryTranslationKey(categoryNameFromApi), { defaultValue: categoryNameFromApi }),
      amount: data.amount, // in cents
      color: data.color
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
        amount: tx.amount.amount, // in cents
        currencyCode: tx.amount.currency.code,
        date: format(parseISO(tx.date), "PP", { locale: dateFnsLocale }),
      };
    });
  }, [lastTransactions, transactionTypes, t, dateFnsLocale, isLoadingTransactionTypes]);


  const calculateAverageExpense = (monthlyExpenseInCents: number, period: 'daily' | 'weekly' | 'monthly') => {
    if (period === 'monthly') return monthlyExpenseInCents;
    if (period === 'daily') return Math.round(monthlyExpenseInCents / 30); // Simplified assumption
    if (period === 'weekly') return Math.round(monthlyExpenseInCents / 4); // Simplified assumption
    return 0;
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveChartIndex(index);
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
    <Card className={`bg-destructive/10 border-destructive text-destructive-foreground ${spanFull ? 'md:col-span-3 lg:col-span-2' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{t('errorFetchingData')}</CardTitle>
        <AlertTriangle className="h-5 w-5 text-destructive" />
      </CardHeader>
      <CardContent>
        <p className="text-sm">{t(messageKey as any)}</p>
      </CardContent>
    </Card>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="font-headline text-3xl font-bold text-foreground">{t('dashboard')}</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoadingSummary ? (
            <>
              {renderSkeletonCard(t('totalBalance'), <Wallet className="h-5 w-5 text-primary" />)}
              {renderSkeletonCard(t('monthlyIncome'), <TrendingUp className="h-5 w-5 text-green-500" />)}
              {renderSkeletonCard(t('averageExpense'), <TrendingDown className="h-5 w-5 text-red-500" />, '', 3)}
            </>
          ) : !summaryData ? (
            renderErrorState('noDataAvailable', true)
          ) : (
            <>
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalBalance')}</CardTitle>
                  <Wallet className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
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
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
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
                      <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                        <CurrencyDisplay amountInCents={calculateAverageExpense(summaryData.month_expense, 'daily')} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('weekly')}</p>
                      <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                        <CurrencyDisplay amountInCents={calculateAverageExpense(summaryData.month_expense, 'weekly')} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('monthly')}</p>
                      <div className="text-lg font-semibold text-red-600 dark:text-red-400">
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
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
            <CardContent className="pt-4">
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
                <ChartContainer config={chartConfig} className="aspect-square h-[300px] sm:h-[350px] w-full mx-auto">
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          hideLabel
                          className="bg-card text-card-foreground shadow-lg border"
                          formatter={(value, name, itemProps) => {
                            const currency = user?.userCurrency?.code || 'USD';
                            const categoryDisplayName = itemProps.payload.categoryName;
                            return (
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium text-foreground">{categoryDisplayName}</span>
                                <CurrencyDisplay amountInCents={value as number} currencyCode={currency} />
                              </div>
                            );
                          }}
                        />
                      }
                    />
                    <Pie
                      data={transformedChartData}
                      dataKey="amount" 
                      nameKey="categoryName" 
                      innerRadius="60%"
                      outerRadius="80%"
                      activeIndex={activeChartIndex}
                      activeShape={(props: ActiveShapeProps) => renderActiveShape(props, user?.userCurrency?.code, t) }
                      onMouseEnter={onPieEnter}
                      className="cursor-pointer"
                    >
                      {transformedChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || chartConfig[entry.categoryName]?.color || `hsl(var(--chart-${(index % 5) + 1}))`} />
                      ))}
                    </Pie>
                    <Legend content={({ payload }) => {
                        if (!payload) return null;
                        return (
                          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-4 text-xs">
                            {payload.map((entry, index) => ( 
                              <div key={`item-${index}`} className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span>{entry.value}</span> 
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-semibold text-foreground">{t('lastActivityTitle')}</CardTitle>
              <Activity className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent className="pt-4">
              {isLoadingLastActivity || isLoadingTransactionTypes ? ( // Check for types loading as well
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
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                {item.icon}
                                <div className="flex-grow">
                                    <p className="text-sm font-medium text-foreground truncate max-w-[150px] sm:max-w-[180px]" title={item.displayText}>
                                        {item.displayText}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{item.date}</p>
                                </div>
                            </div>
                            <div className="text-sm font-medium text-right">
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
      </div>
    </MainLayout>
  );
}

