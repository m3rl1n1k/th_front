
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import {
  getDashboardTotalBalance,
  getDashboardMonthlyIncome,
  getDashboardMonthExpenses,
  getDashboardChartTotalExpense, // Updated
  getDashboardLastTransactions,   // New
  getTransactionTypes
} from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Wallet, PieChart as PieChartIcon, ExternalLink, ListChecks, ArrowUpCircle, ArrowDownCircle, HelpCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { MonthlyExpensesByCategoryResponse, MonthlyExpenseByCategoryItem, DashboardLastTransactionsResponse, DashboardLastTransactionItem, TransactionType } from '@/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { PieChart, Pie, Cell, Tooltip, Legend, Sector } from "recharts"
import Link from 'next/link';
import { format, parseISO } from 'date-fns';


interface DashboardSummaryData {
  total_balance: number;
  month_income: number;
  month_expense: number;
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
  payload: MonthlyExpenseByCategoryItem;
  percent: number;
  value: number;
}

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


export default function DashboardPage() {
  const { user, token, isAuthenticated } = useAuth();
  const { t, dateFnsLocale } = useTranslation();
  const { toast } = useToast();
  const [summaryData, setSummaryData] = useState<DashboardSummaryData | null>(null);
  const [expensesByCategoryData, setExpensesByCategoryData] = useState<MonthlyExpensesByCategoryResponse | null>(null);
  const [lastTransactions, setLastTransactions] = useState<DashboardLastTransactionItem[] | null>(null);
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
  
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingExpensesChart, setIsLoadingExpensesChart] = useState(true);
  const [isLoadingLastTransactions, setIsLoadingLastTransactions] = useState(true);
  const [isLoadingTxTypes, setIsLoadingTxTypes] = useState(true);

  const [activeChartIndex, setActiveChartIndex] = useState(0);


  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoadingSummary(true);
      setIsLoadingExpensesChart(true);
      setIsLoadingLastTransactions(true);
      setIsLoadingTxTypes(true);

      Promise.all([
        getDashboardTotalBalance(token),
        getDashboardMonthlyIncome(token),
        getDashboardMonthExpenses(token),
        getDashboardChartTotalExpense(token),
        getDashboardLastTransactions(token),
        getTransactionTypes(token)
      ])
        .then(([balanceData, incomeData, expenseData, chartData, lastTransactionsData, txTypesData]) => {
          setSummaryData({
            total_balance: balanceData.total_balance,
            month_income: incomeData.month_income,
            month_expense: expenseData.month_expense,
          });
          setExpensesByCategoryData(chartData);
          setLastTransactions(lastTransactionsData.transactions || []);
          setTransactionTypes(Object.entries(txTypesData.types).map(([id, name]) => ({ id, name: name as string })));
        })
        .catch(error => {
          toast({
            variant: "destructive",
            title: t('errorFetchingData'),
            description: error.message || "Could not load dashboard data.",
          });
          setSummaryData(null);
          setExpensesByCategoryData(null);
          setLastTransactions(null);
          setTransactionTypes([]);
        })
        .finally(() => {
          setIsLoadingSummary(false);
          setIsLoadingExpensesChart(false);
          setIsLoadingLastTransactions(false);
          setIsLoadingTxTypes(false);
        });

    } else if (!isAuthenticated) {
      setIsLoadingSummary(false);
      setIsLoadingExpensesChart(false);
      setIsLoadingLastTransactions(false);
      setIsLoadingTxTypes(false);
    }
  }, [token, isAuthenticated, t, toast]);

  const processedLastTransactions = useMemo(() => {
    if (!lastTransactions || !transactionTypes.length) return null;
    return lastTransactions.map(tx => {
      const typeInfo = transactionTypes.find(tt => tt.id === String(tx.type));
      let icon = <HelpCircle className="h-5 w-5 text-muted-foreground" />;
      if (typeInfo?.name.toUpperCase() === 'INCOME') {
        icon = <ArrowUpCircle className="h-5 w-5 text-green-500" />;
      } else if (typeInfo?.name.toUpperCase() === 'EXPENSE') {
        icon = <ArrowDownCircle className="h-5 w-5 text-red-500" />;
      }
      return {
        ...tx,
        typeName: typeInfo ? t(`transactionType_${typeInfo.name}` as any, { defaultValue: typeInfo.name }) : t('transactionType_UNKNOWN'),
        icon: icon
      };
    });
  }, [lastTransactions, transactionTypes, t]);


  const calculateAverageExpense = (monthlyExpense: number, period: 'daily' | 'weekly' | 'monthly') => {
    if (period === 'monthly') return monthlyExpense;
    if (period === 'daily') return Math.round(monthlyExpense / 30);
    if (period === 'weekly') return Math.round(monthlyExpense / 4);
    return 0;
  };

  const chartConfig = useMemo(() => {
    if (!expensesByCategoryData) return {} as ChartConfig;
    return expensesByCategoryData.expensesByCategory.reduce((acc, item, index) => {
      acc[item.categoryName] = {
        label: item.categoryName,
        color: item.color || `hsl(var(--chart-${(index % 5) + 1}))`,
      };
      return acc;
    }, {} as ChartConfig);
  }, [expensesByCategoryData]);
  
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
              ) : !expensesByCategoryData || expensesByCategoryData.expensesByCategory.length === 0 ? (
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
                    <Tooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel className="bg-card text-card-foreground shadow-lg border" />}
                    />
                    <Pie
                      data={expensesByCategoryData.expensesByCategory}
                      dataKey="amount"
                      nameKey="categoryName"
                      innerRadius="60%"
                      outerRadius="80%"
                      activeIndex={activeChartIndex}
                      activeShape={(props: ActiveShapeProps) => renderActiveShape(props, user?.userCurrency?.code, t) }
                      onMouseEnter={onPieEnter}
                      className="cursor-pointer"
                    >
                      {expensesByCategoryData.expensesByCategory.map((entry, index) => (
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
              <ListChecks className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent className="pt-4">
              {isLoadingLastTransactions || isLoadingTxTypes ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  ))}
                </div>
              ) : !processedLastTransactions || processedLastTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <ListChecks className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">{t('noRecentActivity')}</p>
                   <Button variant="link" asChild className="mt-2">
                    <Link href="/transactions/new">
                      {t('addNewTransaction')} <ExternalLink className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {processedLastTransactions.slice(0, 10).map((tx) => (
                    <Link href={`/transactions/${tx.id}`} key={tx.id} className="block p-3 rounded-md hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">{tx.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate" title={tx.description || t('noDescription')}>
                            {tx.description || t('noDescription')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(tx.date), 'PP', { locale: dateFnsLocale })} - {tx.typeName}
                          </p>
                        </div>
                        <div className="text-sm font-medium text-right">
                          <CurrencyDisplay amountInCents={tx.amount.amount} currencyCode={tx.amount.currency.code} />
                        </div>
                      </div>
                    </Link>
                  ))}
                  {processedLastTransactions.length > 0 && (
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
