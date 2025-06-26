
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
  getDashboardMainWalletBalance,
} from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, PieChart as PieChartIcon, ExternalLink, ListChecks, Activity, ArrowUpCircle, ArrowDownCircle, HelpCircle, Loader2, ArrowRightLeft, Target, Eye, BarChartHorizontal, PlusCircle, WalletCards, Shapes, Maximize, Landmark, EyeOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { MonthlyExpensesByCategoryResponse, Transaction as TransactionType, TransactionType as AppTransactionType, MonthlyBudgetSummary, ApiError } from '@/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { PieChart, Pie, Cell, Sector } from "recharts"
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';


interface DashboardSummaryData {
  total_balance: number;
  main_wallet_balance: number;
  month_income: number;
  month_expense: number;
}

interface AverageExpensesData {
  daily: number;
  weekly: number;
  monthly: number;
}

interface TransformedChartItem {
  categoryName: string;
  amount: number;
  color?: string;
  fill?: string;
}

const generateCategoryTranslationKey = (name: string | undefined | null): string => {
  if (!name) return '';
  return name.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

interface ProcessedLastTransactionItem {
  id: string | number;
  icon: React.ReactElement;
  displayText: string;
  amount: number;
  currencyCode: string;
  date: string;
}

const DASHBOARD_LAST_TRANSACTIONS_LIMIT = 5;

type DashboardCardId = 'total_balance' | 'main_wallet_balance' | 'monthly_income' | 'average_expenses' | 'expenses_chart' | 'last_activity' | 'current_budget' | 'quick_actions';

const DEFAULT_CARD_ORDER: DashboardCardId[] = ['total_balance', 'main_wallet_balance', 'monthly_income', 'average_expenses', 'quick_actions', 'expenses_chart', 'last_activity', 'current_budget'];

const DEFAULT_VISIBILITY: Record<DashboardCardId, boolean> = {
  total_balance: true,
  main_wallet_balance: true,
  monthly_income: true,
  average_expenses: true,
  expenses_chart: true,
  last_activity: true,
  current_budget: true,
  quick_actions: true,
};

const DEFAULT_SIZES: Record<string, string> = {
  total_balance: '1x1',
  main_wallet_balance: '1x1',
  monthly_income: '1x1',
  average_expenses: '1x1',
  quick_actions: '2x1',
  expenses_chart: '2x2',
  last_activity: '2x2',
  current_budget: '2x1',
};


const DASHBOARD_SETTINGS_KEY = 'dashboard_layout_settings';

interface DashboardCard {
  id: DashboardCardId;
  component: React.ReactNode;
}

const sizeToClassMap: Record<string, string> = {
  '1x1': 'lg:col-span-1 lg:row-span-1',
  '1x2': 'lg:col-span-1 lg:row-span-2',
  '2x1': 'lg:col-span-2 lg:row-span-1',
  '2x2': 'lg:col-span-2 lg:row-span-2',
  '4x1': 'lg:col-span-4 lg:row-span-1',
  '4x2': 'lg:col-span-4 lg:row-span-2',
};

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
  
  const isSmallChart = outerRadius < 80;
  
  const lineStartOffset = isSmallChart ? 5 : 10;
  const lineMidOffset = isSmallChart ? 15 : 30;
  const lineEndOffset = isSmallChart ? 12 : 22;
  const labelOffset = isSmallChart ? 8 : 12;

  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + lineStartOffset) * cos;
  const sy = cy + (outerRadius + lineStartOffset) * sin;
  const mx = cx + (outerRadius + lineMidOffset) * cos;
  const my = cy + (outerRadius + lineMidOffset) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * lineEndOffset;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      {/* Background circle for the center text to improve readability */}
      <circle cx={cx} cy={cy} r={innerRadius} fill="hsl(var(--background))" opacity="0.6" />
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill="hsl(var(--foreground))" className="font-semibold text-sm sm:text-base">{payload.categoryName}</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + (isSmallChart ? 2 : 6)}
        outerRadius={outerRadius + (isSmallChart ? 4 : 10)}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={isSmallChart ? 1.5 : 2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * labelOffset} y={ey} textAnchor={textAnchor} fill="hsl(var(--foreground))" className="text-xs sm:text-sm">{`(${(percent * 100).toFixed(1)}%)`}</text>
    </g>
  );
};


export default function DashboardPage() {
  const { user, token, isAuthenticated } = useAuth();
  const { t, dateFnsLocale } = useTranslation();
  const { toast } = useToast();

  const [summaryData, setSummaryData] = useState<DashboardSummaryData | null>(null);
  const [averageExpenses, setAverageExpensesData] = useState<AverageExpensesData | null>(null);
  const [expensesByCategoryData, setExpensesByCategoryData] = useState<MonthlyExpensesByCategoryResponse | null>(null);
  const [lastTransactions, setLastTransactions] = useState<TransactionType[] | null>(null);
  const [transactionTypes, setTransactionTypes] = useState<AppTransactionType[]>([]);
  const [activePieIndex, setActivePieIndex] = useState(0);
  const [currentMonthBudget, setCurrentMonthBudget] = useState<MonthlyBudgetSummary | null>(null);
  const [showAmounts, setShowAmounts] = useState(true);

  const [isLoading, setIsLoading] = useState(true);

  const [dashboardSettings, setDashboardSettings] = useState({
    order: DEFAULT_CARD_ORDER,
    visibility: DEFAULT_VISIBILITY,
    sizes: DEFAULT_SIZES,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedSettings = localStorage.getItem(DASHBOARD_SETTINGS_KEY);
      if (storedSettings) {
        try {
          const parsedSettings = JSON.parse(storedSettings);
          const allCardIds = new Set(DEFAULT_CARD_ORDER);

          const savedOrder = parsedSettings.dashboard_cards_order || DEFAULT_CARD_ORDER;
          const currentOrder = savedOrder.filter((id: string): id is DashboardCardId => allCardIds.has(id as DashboardCardId));
          DEFAULT_CARD_ORDER.forEach(card => {
              if (!currentOrder.includes(card)) {
                  currentOrder.push(card);
              }
          });

          setDashboardSettings({
            order: currentOrder,
            visibility: { ...DEFAULT_VISIBILITY, ...parsedSettings.dashboard_cards_visibility },
            sizes: { ...DEFAULT_SIZES, ...parsedSettings.dashboard_cards_sizes },
          });
        } catch (e) {
          setDashboardSettings({
            order: DEFAULT_CARD_ORDER,
            visibility: DEFAULT_VISIBILITY,
            sizes: DEFAULT_SIZES,
          });
        }
      }
    }
  }, []);

  const orderedCardIds = useMemo(() => {
    return dashboardSettings.order;
  }, [dashboardSettings.order]);

  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoading(true);
      const limit = DASHBOARD_LAST_TRANSACTIONS_LIMIT;
      const currentMonthKey = format(new Date(), 'yyyy-MM');

      Promise.all([
        getDashboardTotalBalance(token),
        getDashboardMainWalletBalance(token),
        getDashboardMonthlyIncome(token),
        getDashboardMonthExpenses(token),
        getDashboardLastTransactions(token, limit),
        getTransactionTypes(token),
        getDashboardChartTotalExpense(token),
        getBudgetList(token)
      ])
        .then(([balanceData, mainWalletBalanceData, incomeData, expenseData, lastTransactionsResp, typesData, chartData, budgetListResponse]) => {
          setSummaryData({
            total_balance: balanceData.total_balance,
            main_wallet_balance: mainWalletBalanceData.main_wallet_balance,
            month_income: incomeData.month_income,
            month_expense: expenseData.month_expense,
          });

          const monthlyExpense = expenseData.month_expense;
          setAverageExpensesData({
            daily: monthlyExpense / 30, // Approximation
            weekly: monthlyExpense / 4.345, // Approximation
            monthly: monthlyExpense,
          });

          setExpensesByCategoryData(chartData);
          setLastTransactions(lastTransactionsResp.last_transactions || []);
          const formattedTypes = Object.entries(typesData.types).map(([id, name]) => ({ id, name: name as string }));
          setTransactionTypes(formattedTypes);
          setCurrentMonthBudget(budgetListResponse.budgets[currentMonthKey] || null);
        })
        .catch((error: ApiError) => {
          if (error.code !== 401) {
            toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message || t('dashboardDataLoadError') });
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!isAuthenticated) {
      setIsLoading(false);
    }
  }, [token, isAuthenticated, t, toast]);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActivePieIndex(index);
  }, []);

  const transformedChartData = useMemo((): TransformedChartItem[] => {
    if (!expensesByCategoryData?.month_expense_chart) return [];
    return Object.entries(expensesByCategoryData.month_expense_chart).map(([categoryNameFromApi, data], index) => ({
      categoryName: categoryNameFromApi === 'no_category' ? t('noCategory') : t(generateCategoryTranslationKey(categoryNameFromApi), { defaultValue: categoryNameFromApi }),
      amount: data.amount,
      color: data.color,
      fill: data.color || `hsl(var(--chart-${(index % 5) + 1}))`,
    }));
  }, [expensesByCategoryData, t]);

  const chartConfig = useMemo((): ChartConfig => {
    if (!expensesByCategoryData?.month_expense_chart) return {} as ChartConfig;
    const config: ChartConfig = {};
    Object.entries(expensesByCategoryData.month_expense_chart).forEach(([keyFromApi, item], index) => {
      const displayName = keyFromApi === 'no_category' ? t('noCategory') : t(generateCategoryTranslationKey(keyFromApi), { defaultValue: keyFromApi });
      config[displayName] = {
        label: displayName,
        color: item.color || `hsl(var(--chart-${(index % 5) + 1}))`,
      };
    });
    return config;
  }, [expensesByCategoryData, t]);

  const processedLastActivity = useMemo((): ProcessedLastTransactionItem[] | null => {
    if (!lastTransactions) return null;
    return lastTransactions.map(tx => {
      const txTypeName = transactionTypes.find(type => type.id === String(tx.type))?.name?.toUpperCase();
      let icon;
      if (txTypeName === 'INCOME') icon = <ArrowUpCircle className="h-5 w-5 text-green-500" />;
      else if (txTypeName === 'EXPENSE') icon = <ArrowDownCircle className="h-5 w-5 text-red-500" />;
      else if (txTypeName === 'TRANSFER') icon = <ArrowRightLeft className="h-5 w-5 text-blue-500" />;
      else icon = <HelpCircle className="h-5 w-5 text-muted-foreground" />;
      
      const categoryDisplayName = tx.subCategory 
        ? t(generateCategoryTranslationKey(tx.subCategory.name), { defaultValue: tx.subCategory.name }) 
        : t('noCategory');
      
      return {
        id: tx.id,
        icon,
        displayText: categoryDisplayName,
        amount: tx.amount.amount,
        currencyCode: tx.amount.currency.code,
        date: format(parseISO(tx.date), "PP", { locale: dateFnsLocale }),
      };
    });
  }, [lastTransactions, transactionTypes, t, dateFnsLocale]);

  const getProgressColor = (percentage: number): string => {
    if (percentage > 100) return 'bg-red-600 dark:bg-red-500';
    if (percentage > 75) return 'bg-orange-500 dark:bg-orange-400';
    if (percentage > 50) return 'bg-yellow-500 dark:bg-yellow-400';
    return 'bg-green-500 dark:bg-green-400';
  };

  const customTooltipFormatter = (value: any, name: any, item: any) => {
    const numberValue = typeof value === 'number' ? value : 0;
    const formattedValue = new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: false,
    }).format(numberValue / 100);

    return (
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: item.payload.fill }}
          />
          <span className="text-muted-foreground">{item.name}</span>
        </div>
        <span className="font-mono font-medium tabular-nums text-foreground">
            {showAmounts ? `${formattedValue} ${user?.userCurrency?.code || ''}` : '••••••'}
        </span>
      </div>
    );
  };

  const renderTotalBalanceCard = () => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 w-full h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{t('totalBalance')}</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-grow flex items-center">
        {isLoading || !summaryData ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold"><CurrencyDisplay isVisible={showAmounts} amountInCents={summaryData.total_balance} /></div>}
      </CardContent>
    </Card>
  );

  const renderMainWalletBalanceCard = () => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 w-full h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{t('mainWalletBalance')}</CardTitle>
        <Landmark className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-grow flex items-center">
        {isLoading || !summaryData ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold"><CurrencyDisplay isVisible={showAmounts} amountInCents={summaryData.main_wallet_balance} /></div>}
      </CardContent>
    </Card>
  );

  const renderMonthlyIncomeCard = () => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 w-full h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{t('monthlyIncome')}</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-grow flex items-center">
        {isLoading || !summaryData ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold text-green-600 dark:text-green-400"><CurrencyDisplay isVisible={showAmounts} amountInCents={summaryData.month_income} /></div>}
      </CardContent>
    </Card>
  );

  const renderAverageExpensesCard = () => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 w-full h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{t('averageExpense')}</CardTitle>
        <BarChartHorizontal className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-2 pt-2 flex-grow flex flex-col justify-center">
        {isLoading || !averageExpenses ? (
          <>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </>
        ) : (
          <>
            <div className="flex justify-between items-baseline text-sm">
              <span className="text-muted-foreground">{t('daily')}</span>
              <span className="font-medium"><CurrencyDisplay isVisible={showAmounts} amountInCents={averageExpenses.daily} /></span>
            </div>
            <div className="flex justify-between items-baseline text-sm">
              <span className="text-muted-foreground">{t('weekly')}</span>
              <span className="font-medium"><CurrencyDisplay isVisible={showAmounts} amountInCents={averageExpenses.weekly} /></span>
            </div>
            <div className="flex justify-between items-baseline text-sm">
              <span className="text-muted-foreground">{t('monthly')}</span>
              <span className="font-medium"><CurrencyDisplay isVisible={showAmounts} amountInCents={averageExpenses.monthly} /></span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const renderQuickActionsCard = () => {
    const actions = [
      { href: '/transactions/new', labelKey: 'quickActionCreateTransaction', icon: ListChecks },
      { href: '/wallets/new', labelKey: 'quickActionCreateWallet', icon: WalletCards },
      { href: '/categories/new', labelKey: 'quickActionCreateCategory', icon: Shapes },
      { href: '/budgets/new', labelKey: 'quickActionCreateBudget', icon: Target },
    ];

    return (
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-primary" />
            {t('dashboardCardQuickActions')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow grid grid-cols-2 gap-4 pt-4">
          {actions.map(action => (
            <Button asChild key={action.href} variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2 text-center hover:bg-accent/50 hover:border-primary/50 transition-all">
              <Link href={action.href}>
                <action.icon className="h-6 w-6 text-primary" />
                <span className="text-xs font-medium">{t(action.labelKey as any)}</span>
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
    );
  };

  const renderExpensesChart = () => (
    <Dialog>
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between p-6">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-foreground">
              <PieChartIcon className="h-6 w-6 text-primary" />
              {t('dashboardCardExpensesChart')}
            </CardTitle>
          </div>
          {(!isLoading && transformedChartData.length > 0) && (
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Maximize className="h-5 w-5" />
                    <span className="sr-only">Expand chart</span>
                </Button>
            </DialogTrigger>
          )}
        </CardHeader>
        <CardContent className="p-6 pt-0 flex-grow flex items-center justify-center">
          {isLoading ? (<div className="flex justify-center items-center h-72"><Skeleton className="h-64 w-64 rounded-full" /></div>) : !expensesByCategoryData || transformedChartData.length === 0 ? (<div className="flex flex-col items-center justify-center h-72 text-center"><PieChartIcon className="h-16 w-16 text-muted-foreground mb-4" /><p className="text-muted-foreground">{t('noDataAvailable')}</p><p className="text-sm text-muted-foreground">{t('tryAddingExpenses')}</p><Button variant="link" asChild className="mt-2"><Link href="/transactions/new">{t('addNewTransaction')} <ExternalLink className="ml-1 h-4 w-4" /></Link></Button></div>) : (<ChartContainer config={chartConfig} className="mx-auto aspect-video h-full w-full max-w-lg"><PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}><ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={customTooltipFormatter} />} /><Pie data={transformedChartData} dataKey="amount" nameKey="categoryName" cx="50%" cy="50%" innerRadius="30%" strokeWidth={2} activeIndex={activePieIndex} activeShape={renderActiveShape} onMouseEnter={onPieEnter}>{transformedChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} className="focus:outline-none" />))}</Pie></PieChart></ChartContainer>)}
        </CardContent>
      </Card>
      <DialogContent className="max-w-3xl h-auto sm:h-[80vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>{t('dashboardCardExpensesChart')}</DialogTitle>
        </DialogHeader>
        <div className="flex-grow flex items-center justify-center h-full w-full p-4">
             <ChartContainer config={chartConfig} className="h-full w-full">
                <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={customTooltipFormatter} />} />
                    <Pie data={transformedChartData} dataKey="amount" nameKey="categoryName" cx="50%" cy="50%" innerRadius="30%" outerRadius="80%" strokeWidth={2} activeIndex={activePieIndex} activeShape={renderActiveShape} onMouseEnter={onPieEnter}>
                        {transformedChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} className="focus:outline-none" />))}
                    </Pie>
                </PieChart>
             </ChartContainer>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderLastActivity = () => (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
      <CardHeader className="p-6">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-foreground">
          <Activity className="h-6 w-6 text-primary" />
          {t('dashboardCardLastActivity')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0 flex-grow">
        {isLoading ? (<div className="space-y-4">{[...Array(5)].map((_, i) => (<div key={i} className="flex items-center space-x-3 p-2"><Skeleton className="h-6 w-6 rounded-md" /><div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div><Skeleton className="h-4 w-1/4" /></div>))}</div>) : !processedLastActivity || processedLastActivity.length === 0 ? (<div className="flex flex-col items-center justify-center h-full text-center"><ListChecks className="h-12 w-12 text-muted-foreground mb-3" /><p className="text-muted-foreground">{t('noRecentTransactions')}</p><Button variant="link" asChild className="mt-2"><Link href="/transactions/new">{t('addNewTransaction')} <ExternalLink className="ml-1 h-4 w-4" /></Link></Button></div>) : (<div className="space-y-1">{processedLastActivity.map((item) => (<Link key={item.id} href={`/transactions/${item.id}`} className="block p-3 rounded-md hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="flex items-center justify-between gap-2"><div className="flex items-center space-x-3 flex-shrink min-w-0">{item.icon}<div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate" title={item.displayText}>{item.displayText}</p><p className="text-xs text-muted-foreground">{item.date}</p></div></div><div className="text-sm font-medium text-right flex-shrink-0 ml-2"><CurrencyDisplay isVisible={showAmounts} amountInCents={item.amount} currencyCode={item.currencyCode} /></div></div></Link>))}</div>)}
      </CardContent>
      {processedLastActivity && processedLastActivity.length > 0 && (<CardFooter className="p-6 pt-0"><Button variant="outline" asChild className="w-full mt-auto"><Link href="/transactions">{t('viewAllTransactions')} <ExternalLink className="ml-2 h-4 w-4" /></Link></Button></CardFooter>)}
    </Card>
  );

  const renderCurrentMonthBudget = () => {
    if (isLoading) return <Skeleton className="h-full min-h-[400px]" />;
    const currentMonthKey = format(new Date(), 'yyyy-MM');

    return (
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card/80 dark:bg-card/50 h-full">
        <CardHeader className="p-6">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Target className="h-6 w-6 text-primary" />
            {t('dashboardCardCurrentBudget')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4 flex-grow flex flex-col justify-center">
          {!currentMonthBudget ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">{t('noCurrentMonthBudget')}</p>
              <Button asChild variant="secondary"><Link href="/budgets/new">{t('budgetCreateNewButton')}</Link></Button>
            </div>
          ) : (
            <>
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm text-muted-foreground">{t('budgetProgress', { percentage: (currentMonthBudget.totalPlanned.amount > 0 ? (currentMonthBudget.totalActual.amount / currentMonthBudget.totalPlanned.amount) * 100 : (currentMonthBudget.totalActual.amount > 0 ? 101 : 0)).toFixed(0) })}</span>
                  {(currentMonthBudget.totalPlanned.amount > 0 ? (currentMonthBudget.totalActual.amount / currentMonthBudget.totalPlanned.amount) * 100 : (currentMonthBudget.totalActual.amount > 0 ? 101 : 0)) > 100 && (<span className="text-sm font-semibold text-red-500">{t('budgetOverspentWarning')}</span>)}
                </div>
                <Progress value={(currentMonthBudget.totalPlanned.amount > 0 ? (currentMonthBudget.totalActual.amount / currentMonthBudget.totalPlanned.amount) * 100 : (currentMonthBudget.totalActual.amount > 0 ? 101 : 0)) > 100 ? 100 : (currentMonthBudget.totalPlanned.amount > 0 ? (currentMonthBudget.totalActual.amount / currentMonthBudget.totalPlanned.amount) * 100 : (currentMonthBudget.totalActual.amount > 0 ? 101 : 0))} indicatorClassName={getProgressColor((currentMonthBudget.totalPlanned.amount > 0 ? (currentMonthBudget.totalActual.amount / currentMonthBudget.totalPlanned.amount) * 100 : (currentMonthBudget.totalActual.amount > 0 ? 101 : 0)))} aria-label={t('budgetProgress', { percentage: (currentMonthBudget.totalPlanned.amount > 0 ? (currentMonthBudget.totalActual.amount / currentMonthBudget.totalPlanned.amount) * 100 : (currentMonthBudget.totalActual.amount > 0 ? 101 : 0)).toFixed(0) })} className="h-2" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center"><TrendingUp className="mr-1.5 h-4 w-4 text-green-500" />{t('budgetTotalPlannedShort')}</span><span className="font-semibold text-foreground"><CurrencyDisplay isVisible={showAmounts} amountInCents={currentMonthBudget.totalPlanned.amount} currencyCode={currentMonthBudget.totalPlanned.currency.code} /></span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground flex items-center"><TrendingDown className="mr-1.5 h-4 w-4 text-red-500" />{t('budgetTotalActualShort')}</span><span className="font-semibold text-red-600 dark:text-red-400"><CurrencyDisplay isVisible={showAmounts} amountInCents={currentMonthBudget.totalActual.amount} currencyCode={currentMonthBudget.totalActual.currency.code} /></span></div>
              </div>
              <div className={cn("w-full text-center p-3 rounded-md font-semibold text-base sm:text-lg", (currentMonthBudget.totalPlanned.amount - currentMonthBudget.totalActual.amount) >= 0 ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400")}><p className="text-xs sm:text-sm uppercase tracking-wider opacity-80 mb-1">{t('budgetRemainingAmountShort')}</p><CurrencyDisplay isVisible={showAmounts} amountInCents={currentMonthBudget.totalPlanned.amount - currentMonthBudget.totalActual.amount} currencyCode={currentMonthBudget.totalPlanned.currency.code} /></div>
            </>
          )}
        </CardContent>
        {currentMonthBudget && <CardFooter className="pt-3 p-6"><Button variant="outline" size="default" asChild className="w-full"><Link href={`/budgets/summary/${currentMonthKey}`}><Eye className="mr-2 h-5 w-5" />{t('detailsAction')}</Link></Button></CardFooter>}
      </Card>
    );
  };

  const allCards: DashboardCard[] = [
    { id: 'total_balance', component: renderTotalBalanceCard() },
    { id: 'main_wallet_balance', component: renderMainWalletBalanceCard() },
    { id: 'monthly_income', component: renderMonthlyIncomeCard() },
    { id: 'average_expenses', component: renderAverageExpensesCard() },
    { id: 'quick_actions', component: renderQuickActionsCard() },
    { id: 'expenses_chart', component: renderExpensesChart() },
    { id: 'last_activity', component: renderLastActivity() },
    { id: 'current_budget', component: renderCurrentMonthBudget() },
  ];

  const visibleCardIds = useMemo(() => {
    const visibility = dashboardSettings.visibility;
    return orderedCardIds.filter(id => visibility[id] !== false);
  }, [orderedCardIds, dashboardSettings.visibility]);

  const visibleCards = useMemo(() => {
    return visibleCardIds.map(id => allCards.find(c => c.id === id)).filter(Boolean) as DashboardCard[];
  }, [visibleCardIds, allCards]);


  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="font-headline text-2xl sm:text-3xl font-bold text-foreground">{t('dashboard')}</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAmounts(!showAmounts)}
              title={showAmounts ? t('hideAmounts') : t('showAmounts')}
            >
              {showAmounts ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showAmounts ? t('hideAmounts') : t('showAmounts')}
            </Button>
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ?
            [...Array(8)].map((_, i) => <Skeleton key={i} className="h-48" />) :
            visibleCards.map(({ id, component }) => {
              const size = dashboardSettings.sizes[id] || '1x1';
              const sizeClasses = sizeToClassMap[size] || sizeToClassMap['1x1'];
              
              return (
                <div key={id} className={cn(sizeClasses, "self-stretch")}>
                  {React.cloneElement(component as React.ReactElement, { className: 'h-full' })}
                </div>
              );
            })}
        </div>
      </div>
    </MainLayout>
  );
}
