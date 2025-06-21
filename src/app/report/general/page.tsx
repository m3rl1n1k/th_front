
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
import type { ReportDataResponse } from '@/types';
import { FileSignature, AlertTriangle, Loader2, LineChart, BarChart2 as BarChartIcon, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { CurrencyDisplay } from '@/components/common/currency-display';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(0, i).toLocaleString('default', { month: 'long' }),
}));

export default function GeneralReportPage() {
  const { t, dateFnsLocale } = useTranslation();
  const { user, token, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [appliedYear, setAppliedYear] = useState<number | null>(null);
  const [appliedMonth, setAppliedMonth] = useState<number | null>(null);
  
  const [reportData, setReportData] = useState<ReportDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (appliedYear && appliedMonth) {
      fetchReportData();
    }
  }, [appliedYear, appliedMonth, fetchReportData]);

  const formattedPeriod = useMemo(() => {
    if (!appliedYear || !appliedMonth) return '';
    return format(new Date(appliedYear, appliedMonth - 1), 'MMMM yyyy', { locale: dateFnsLocale });
  }, [appliedYear, appliedMonth, dateFnsLocale]);

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
        <h2 className="font-headline text-2xl font-bold text-foreground">
          {t('reportForPeriod', { period: formattedPeriod })}
        </h2>

        {/* Key Financial Stats */}
        <Card>
          <CardHeader>
            <CardTitle>{t('keyFinancialStats')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground flex items-center gap-2"><Wallet className="h-4 w-4" />{t('startOfMonthBalance')}</p>
                  <p className="text-2xl font-bold"><CurrencyDisplay amountInCents={reportData.reportStats.startOfMonthBalance} /></p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-500" />{t('totalIncome')}</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400"><CurrencyDisplay amountInCents={reportData.reportStats.selectedMonthIncome} /></p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground flex items-center gap-2"><TrendingDown className="h-4 w-4 text-red-500" />{t('totalExpense')}</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400"><CurrencyDisplay amountInCents={reportData.reportStats.selectedMonthExpense} /></p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground flex items-center gap-2"><Wallet className="h-4 w-4" />{t('endOfMonthBalance')}</p>
                  <p className="text-2xl font-bold"><CurrencyDisplay amountInCents={reportData.reportStats.endOfMonthBalance} /></p>
              </div>
          </CardContent>
        </Card>

        {/* Expenses by Category Bar Chart */}
        {reportData.categorySummary && reportData.categorySummary.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('monthlyExpensesByCategory')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={reportData.categorySummary.map(item => ({ ...item, amount: item.amount / 100 }))}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => new Intl.NumberFormat(t('language') === 'uk' ? 'uk-UA' : 'en-US', { notation: 'compact', compactDisplay: 'short' }).format(value as number)} />
                  <YAxis dataKey="categoryName" type="category" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value, name, props) => [<CurrencyDisplay amountInCents={(value as number) * 100} />, props.payload.categoryName]} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Bar dataKey="amount" name={t('amount')} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
                <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
                  <SelectTrigger id="month-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
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
