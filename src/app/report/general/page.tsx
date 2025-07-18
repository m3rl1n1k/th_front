
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/context/i18n-context';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getReportData } from '@/lib/api';
import type { ReportDataResponse, MonthlyFinancialSummary } from '@/types';
import { FileSignature, AlertTriangle, Loader2, BarChart2 as BarChartIcon, Wallet, TrendingUp, TrendingDown, LineChart as LineChartIcon } from 'lucide-react';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Cell } from 'recharts';
import { format, parse } from 'date-fns';
import { CurrencyDisplay } from '@/components/common/currency-display';

const years = Array.from({ length: 6 }, (_, i) => 2025 + i); // Range from 2025 to 2030

const generateCategoryTranslationKey = (name: string | undefined | null): string => {
  if (!name) return '';
  return name.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};


export default function GeneralReportPage() {
  const { t, language, dateFnsLocale } = useTranslation();
  const { user, token, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [appliedYear, setAppliedYear] = useState<number | null>(null);
  const [appliedMonth, setAppliedMonth] = useState<string | null>(null);
  
  const [reportData, setReportData] = useState<ReportDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: new Date(new Date().getFullYear(), i).toLocaleString(language, { month: 'long' })
  })), [language]);

  const handleApplyFilters = () => {
    setAppliedYear(selectedYear);
    setAppliedMonth(selectedMonth);
  };
  
  const fetchReportData = useCallback(async () => {
    if (!appliedYear || !appliedMonth || !token) {
      return;
    }
    setIsLoading(true);
    setError(null);
    setReportData(null);
    try {
      const data = await getReportData(token, appliedYear, appliedMonth);
      setReportData(data);
    } catch (err: any) {
      setError(err.message || t('unexpectedError'));
      toast({
        variant: 'destructive',
        title: t('errorFetchingData'),
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [appliedYear, appliedMonth, token, t, toast]);

  useEffect(() => {
    handleApplyFilters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (appliedYear && appliedMonth) {
      fetchReportData();
    }
  }, [appliedYear, appliedMonth, fetchReportData]);

  const formattedPeriod = useMemo(() => {
    if (!appliedYear || !appliedMonth) return '';
    try {
        const parsedDate = parse(`${appliedYear}-${appliedMonth}`, 'yyyy-MM', new Date());
        return format(parsedDate, 'MMMM yyyy', { locale: dateFnsLocale });
    } catch {
        return `${appliedMonth} ${appliedYear}`;
    }
  }, [appliedYear, appliedMonth, dateFnsLocale]);

  const { yearlyChartData, yAxisMax } = useMemo(() => {
    if (!reportData?.yearlySummary || !Array.isArray(reportData.yearlySummary)) {
      return { yearlyChartData: [], yAxisMax: 10000 };
    }
    
    const summaryArray: MonthlyFinancialSummary[] = reportData.yearlySummary;


    const monthMap: { [key: string]: number } = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };

    const chartData = summaryArray
      .filter(item => item.month && item.month.trim() !== "")
      .map(item => {
        const monthIndex = monthMap[item.month as keyof typeof monthMap];
        if (monthIndex === undefined) return { ...item, monthIndex: -1 };
        const monthDate = new Date(appliedYear || new Date().getFullYear(), monthIndex);
        return {
          ...item,
          month: t(`month_${item.month.toLowerCase()}` as any, { defaultValue: format(monthDate, 'MMM', { locale: dateFnsLocale }) }),
          monthIndex: monthIndex
        };
      })
      .sort((a, b) => a.monthIndex - b.monthIndex);

    const maxVal = summaryArray.reduce((max: number, item: MonthlyFinancialSummary) => Math.max(max, item.income, item.expense), 0);
    const topLimit = maxVal > 0 ? (maxVal / 100) + 200 : 1000; // Buffer of 200 units on the base currency

    return { yearlyChartData: chartData, yAxisMax: topLimit };
  }, [reportData?.yearlySummary, appliedYear, dateFnsLocale, t]);

  const categoryChartData = useMemo(() => {
    if (!reportData?.categorySummary || typeof reportData.categorySummary !== 'object') {
        return [];
    }
    return Object.values(reportData.categorySummary).map(item => ({
        categoryName: item.name === 'no_category' ? t('noCategory') : t(generateCategoryTranslationKey(item.name), { defaultValue: item.name }),
        amount: item.amount,
        color: item.color,
    }));
  }, [reportData?.categorySummary, t]);


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <Card className="text-center py-10 border-destructive">
          <CardHeader>
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <CardTitle>{t('errorTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
          </CardContent>
        </Card>
      );
    }
    
    if (!reportData) {
      return (
        <Card className="text-center py-10">
          <CardHeader>
            <FileSignature className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>{t('generateReportPrompt')}</CardTitle>
          </CardHeader>
        </Card>
      );
    }

    if (!reportData.reportStats && !reportData.yearlySummary && !reportData.categorySummary) {
        return (
             <Card className="text-center py-10">
                <CardHeader>
                    <FileSignature className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <CardTitle>{t('noReportData')}</CardTitle>
                </CardHeader>
            </Card>
        )
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <Card className="lg:col-span-1 h-full flex flex-col">
                <CardHeader>
                    <CardTitle>{t('keyFinancialStats')}</CardTitle>
                    <CardDescription>{t('reportForPeriod', { period: formattedPeriod })}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 flex-grow">
                    <Card className="p-4 bg-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">{t('startOfMonthBalance')}</p>
                        </div>
                        <p className="text-2xl font-bold"><CurrencyDisplay amountInCents={reportData.reportStats.startOfMonthBalance} /></p>
                    </Card>
                    <Card className="p-4 bg-green-500/10">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <p className="text-sm font-semibold text-green-700 dark:text-green-300">{t('totalIncome')}</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400"><CurrencyDisplay amountInCents={reportData.reportStats.selectedMonthIncome} /></p>
                    </Card>
                    <Card className="p-4 bg-red-500/10">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                            <p className="text-sm font-semibold text-red-700 dark:text-red-300">{t('totalExpense')}</p>
                        </div>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400"><CurrencyDisplay amountInCents={reportData.reportStats.selectedMonthExpense} /></p>
                    </Card>
                    <Card className="p-4 bg-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">{t('endOfMonthBalance')}</p>
                        </div>
                        <p className="text-2xl font-bold"><CurrencyDisplay amountInCents={reportData.reportStats.endOfMonthBalance} /></p>
                    </Card>
                </CardContent>
            </Card>
            
            <Card className="lg:col-span-2 h-full flex flex-col">
                <CardHeader>
                    <CardTitle>{t('monthlyExpensesByCategory')}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-grow">
                     <div className="h-[400px]">
                    {categoryChartData && categoryChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={categoryChartData}
                                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    type="number"
                                    dataKey="amount"
                                    tickFormatter={(value) => {
                                        const numberValue = typeof value === 'number' ? value / 100 : 0;
                                        return new Intl.NumberFormat(language === 'uk' ? 'uk-UA' : 'en-US', {
                                            notation: 'compact',
                                            compactDisplay: 'short'
                                        }).format(numberValue);
                                    }}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis 
                                    dataKey="categoryName" 
                                    type="category" 
                                    width={120}
                                    tick={{ fontSize: 12 }}
                                    interval={0}
                                />
                                <Tooltip
                                    formatter={(value) => [<CurrencyDisplay amountInCents={Number(value)} />, t('amount')]}
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    labelClassName="font-bold text-primary"
                                />
                                <Bar dataKey="amount" name={t('amount')} radius={[0, 4, 4, 0]}>
                                    {categoryChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || 'hsl(var(--primary))'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>{t('noDataAvailable')}</p>
                      </div>
                    )}
                    </div>
                </CardContent>
            </Card>
        </div>
        
        {yearlyChartData && yearlyChartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('yearlyPerformance')}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
               <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={yearlyChartData}
                      margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis
                        domain={[0, yAxisMax]}
                        tickFormatter={(value) => {
                           const numberValue = typeof value === 'number' ? value : 0;
                           return new Intl.NumberFormat(language === 'uk' ? 'uk-UA' : 'en-US', {
                                notation: 'compact',
                                compactDisplay: 'short'
                           }).format(numberValue);
                        }}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          const numberValue = typeof value === 'number' ? value : 0;
                          return [<CurrencyDisplay amountInCents={numberValue} />, t(name.toString() as any, { defaultValue: name.toString()})]
                        }}
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        labelClassName="font-bold text-primary"
                      />
                      <Line type="monotone" dataKey="income" name={t('income')} stroke={user?.settings?.chart_income_color || '#10b981'} strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
                      <Line type="monotone" dataKey="expense" name={t('expense')} stroke={user?.settings?.chart_expense_color || '#ef4444'} strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-3xl font-bold text-foreground flex items-center">
            <FileSignature className="mr-3 h-8 w-8 text-primary" />
            {t('generalReportPageTitle')}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('filterTransactionsTitle')}</CardTitle>
            <CardDescription>{t('selectReportPeriod')}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="year-select">{t('selectYear')}</Label>
                <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                  <SelectTrigger id="year-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="month-select">{t('selectMonth')}</Label>
                <Select value={selectedMonth} onValueChange={(val) => setSelectedMonth(val)}>
                  <SelectTrigger id="month-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleApplyFilters} disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t('applyFiltersButton')}
              </Button>
          </CardContent>
        </Card>

        {renderContent()}

      </div>
    </MainLayout>
  );
}
