
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/context/i18n-context';
import { useAuth } from '@/context/auth-context';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { FileSignature, LineChart as LineChartIcon, PieChart as PieChartIcon, DollarSign, CalendarDays, Loader2, AlertTriangle } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, Sector } from "recharts";
import { format, getYear, getMonth, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import type { ReportPageStats, MonthlyFinancialSummary, CategoryMonthlySummary } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface ActiveShapeProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: CategoryMonthlySummary;
  percent: number;
  value: number;
}

export default function GeneralReportPage() {
  const { t, dateFnsLocale, language } = useTranslation();
  const { user, token } = useAuth();
  const currencyCode = user?.userCurrency?.code || 'USD';
  const { toast } = useToast();

  const currentYear = getYear(new Date());
  const currentMonth = getMonth(new Date()) + 1;

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  const [reportStats, setReportStats] = useState<ReportPageStats | null>(null);
  const [yearlySummary, setYearlySummary] = useState<MonthlyFinancialSummary[]>([]);
  const [categorySummary, setCategorySummary] = useState<CategoryMonthlySummary[]>([]);
  const [activePieIndex, setActivePieIndex] = useState(0);
  const [isLoadingReportData, setIsLoadingReportData] = useState(true);

  const userSettings = user?.settings;

  useEffect(() => {
    setIsLoadingReportData(true);
    // TODO: Implement API calls to fetch actual report data based on selectedYear/Month
    // For now, as API endpoints for this specific aggregated view are not defined,
    // we will set data to empty/null and the UI will show "No data available".
    
    // Simulating an API call delay before showing "No data"
    const timer = setTimeout(() => {
      setReportStats(null); // No data for stats
      setYearlySummary([]);   // No data for yearly summary
      setCategorySummary([]); // No data for category summary
      setIsLoadingReportData(false);
      // Example: toast({ variant: "default", title: "Information", description: "Reporting data backend not yet fully implemented for this view." });
    }, 1000); // Simulate a 1-second fetch

    return () => clearTimeout(timer);
  }, [selectedYear, selectedMonth, currencyCode, token, toast, t]);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i).reverse();
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(selectedYear, i), 'MMMM', { locale: dateFnsLocale }),
  }));

  const yearlyChartConfig = useMemo(() => ({
    income: { label: t('incomeLabel'), color: userSettings?.chart_income_color || "hsl(var(--chart-2))" },
    expense: { label: t('expenseLabel'), color: userSettings?.chart_expense_color || "hsl(var(--chart-1))" },
  } satisfies ChartConfig), [t, userSettings]);

  const categoryChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    categorySummary.forEach((item) => {
      config[item.categoryName] = {
        label: item.categoryName,
        color: item.color || `hsl(var(--chart-${(Object.keys(config).length % 5) + 1}))`,
      };
    });
    return config;
  }, [categorySummary]);

  const onPieEnter = (_: any, index: number) => {
    setActivePieIndex(index);
  };

  const renderActiveShape = (props: ActiveShapeProps) => {
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
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-sm font-semibold">
          {payload.categoryName}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
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
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="hsl(var(--foreground))" className="text-xs">
          <CurrencyDisplay amountInCents={value} currencyCode={currencyCode} />
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="hsl(var(--muted-foreground))" className="text-xs">
          {`(${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };
  
  const renderNoDataMessage = () => (
    <div className="flex flex-col items-center justify-center h-full text-center py-10">
      <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-lg text-muted-foreground">{t('noDataAvailable')}</p>
      <p className="text-sm text-muted-foreground">{t('reportPage.noDataDesc') || 'There is no data to display for the selected period or this report requires further backend integration.'}</p>
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-3xl font-bold text-foreground flex items-center">
            <FileSignature className="mr-3 h-8 w-8 text-primary" />
            {t('generalReportPageTitle')}
          </h1>
        </div>

        <div className="space-y-6 bg-background p-4 rounded-lg">
          <Card>
            <CardHeader>
              <CardTitle>{t('reportFiltersTitle') || "Report Filters"}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="reportYear">{t('selectYear')}</Label>
                <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
                  <SelectTrigger id="reportYear">
                    <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder={t('selectYear')} />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reportMonth">{t('selectMonthPlaceholder')}</Label>
                <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(Number(val))}>
                  <SelectTrigger id="reportMonth">
                    <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder={t('selectMonthPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {isLoadingReportData ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2 mb-2" />
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-20 w-full rounded-md" />
                <Skeleton className="h-20 w-full rounded-md" />
                <Skeleton className="h-20 w-full rounded-md" />
                <Skeleton className="h-20 w-full rounded-md" />
              </CardContent>
            </Card>
          ) : reportStats ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-primary" />
                  {t('reportPageStatsTitle')} - {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy', { locale: dateFnsLocale })}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-md">
                  <p className="text-xs text-muted-foreground">{t('startOfMonthBalanceLabel')}</p>
                  <p className="text-xl font-semibold"><CurrencyDisplay amountInCents={reportStats.startOfMonthBalance} currencyCode={currencyCode} /></p>
                </div>
                <div className="p-4 bg-muted/30 rounded-md">
                  <p className="text-xs text-muted-foreground">{t('endOfMonthBalanceLabel')}</p>
                  <p className="text-xl font-semibold"><CurrencyDisplay amountInCents={reportStats.endOfMonthBalance} currencyCode={currencyCode} /></p>
                </div>
                <div className="p-4 bg-green-500/10 rounded-md">
                  <p className="text-xs text-green-700 dark:text-green-400">{t('incomeLabel')} ({t('forSelectedMonth')})</p>
                  <p className="text-xl font-semibold text-green-600 dark:text-green-300"><CurrencyDisplay amountInCents={reportStats.selectedMonthIncome} currencyCode={currencyCode} /></p>
                </div>
                <div className="p-4 bg-red-500/10 rounded-md">
                  <p className="text-xs text-red-700 dark:text-red-400">{t('expenseLabel')} ({t('forSelectedMonth')})</p>
                  <p className="text-xl font-semibold text-red-600 dark:text-red-400"><CurrencyDisplay amountInCents={reportStats.selectedMonthExpense} currencyCode={currencyCode} /></p>
                </div>
              </CardContent>
            </Card>
          ) : (
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                    <DollarSign className="mr-2 h-5 w-5 text-primary" />
                    {t('reportPageStatsTitle')} - {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy', { locale: dateFnsLocale })}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {renderNoDataMessage()}
                </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChartIcon className="mr-2 h-5 w-5 text-primary" />
                  {t('yearlyIncomeExpenseChartTitle')} - {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[350px] w-full">
                {isLoadingReportData ? (
                  <div className="flex justify-center items-center h-full"> <Skeleton className="h-full w-full" /></div>
                ) : yearlySummary.length > 0 ? (
                  <ChartContainer config={yearlyChartConfig} className="h-full w-full">
                    <LineChart data={yearlySummary} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis tickFormatter={(value) => new Intl.NumberFormat(language, { notation: 'compact', compactDisplay: 'short' }).format(value / 100)} tickLine={false} axisLine={false} />
                      <ChartTooltip
                        cursor={true}
                        content={<ChartTooltipContent indicator="dot" hideLabel
                          formatter={(value, name) => {
                            const configKey = name as keyof typeof yearlyChartConfig;
                            const color = yearlyChartConfig[configKey]?.color;
                            return (
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                                <div>
                                  <p className="font-medium text-foreground">{yearlyChartConfig[configKey]?.label}</p>
                                  <p className="text-muted-foreground">
                                    <CurrencyDisplay amountInCents={value as number} currencyCode={currencyCode} />
                                  </p>
                                </div>
                              </div>
                            );
                          }}
                        />}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="income" stroke={yearlyChartConfig.income.color} strokeWidth={2} dot={{ r: 4, fill: yearlyChartConfig.income.color }} activeDot={{ r: 6, strokeWidth: 1, fill: yearlyChartConfig.income.color }} name={yearlyChartConfig.income.label} />
                      <Line type="monotone" dataKey="expense" stroke={yearlyChartConfig.expense.color} strokeWidth={2} dot={{ r: 4, fill: yearlyChartConfig.expense.color }} activeDot={{ r: 6, strokeWidth: 1, fill: yearlyChartConfig.expense.color }} name={yearlyChartConfig.expense.label} />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  renderNoDataMessage()
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="mr-2 h-5 w-5 text-primary" />
                  {t('monthlyCategorySummaryChartTitle')} - {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy', { locale: dateFnsLocale })}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[350px] w-full flex justify-center items-center">
                {isLoadingReportData ? (
                  <div className="flex justify-center items-center h-full"> <Skeleton className="h-64 w-64 rounded-full" /> </div>
                ) : categorySummary.length > 0 ? (
                  <ChartContainer config={categoryChartConfig} className="aspect-square h-full max-h-[300px]">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="categoryName" hideLabel />} />
                      <Pie
                        data={categorySummary}
                        dataKey="amount"
                        nameKey="categoryName"
                        innerRadius="50%"
                        activeIndex={activePieIndex}
                        activeShape={renderActiveShape}
                        onMouseEnter={onPieEnter}
                      >
                        {categorySummary.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || categoryChartConfig[entry.categoryName]?.color || 'hsl(var(--primary))'} />
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
                ) : (
                  renderNoDataMessage()
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

