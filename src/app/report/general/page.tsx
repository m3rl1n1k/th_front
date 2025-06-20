
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/context/i18n-context';
import { useAuth } from '@/context/auth-context';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { FileSignature, BarChart3, PieChart as PieChartIcon, TrendingUp, TrendingDown, CalendarDays, DollarSign } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Sector } from "recharts";
import { format, getYear, getMonth, startOfMonth, endOfMonth, eachMonthOfInterval, subYears } from 'date-fns';
import type { ReportPageStats, MonthlyFinancialSummary, CategoryMonthlySummary } from '@/types'; // Assuming these types exist

// Placeholder data - replace with actual API calls
const getPlaceholderReportStats = (year: number, month: number, currencyCode: string): ReportPageStats => {
  return {
    startOfMonthBalance: Math.random() * 5000000, // 0 to 50,000 in currency units
    endOfMonthBalance: Math.random() * 6000000,
    selectedMonthIncome: Math.random() * 1000000,
    selectedMonthExpense: Math.random() * 800000,
  };
};

const getPlaceholderYearlySummary = (year: number, currencyCode: string): MonthlyFinancialSummary[] => {
  const months = eachMonthOfInterval({ start: startOfMonth(new Date(year, 0, 1)), end: endOfMonth(new Date(year, 11, 1)) });
  return months.map(m => ({
    month: format(m, 'MMM', {}), // Using current locale from i18n context is tricky here directly
    income: Math.random() * 1500000,
    expense: Math.random() * 1200000,
  }));
};

const getPlaceholderCategorySummary = (year: number, month: number, currencyCode: string): CategoryMonthlySummary[] => {
  const categories = ["Groceries", "Utilities", "Transport", "Entertainment", "Healthcare"];
  const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
  return categories.map((cat, i) => ({
    categoryName: cat,
    amount: Math.random() * 50000,
    color: colors[i % colors.length],
  }));
};


export default function GeneralReportPage() {
  const { t, dateFnsLocale, language } = useTranslation();
  const { user } = useAuth();
  const currencyCode = user?.userCurrency?.code || 'USD';

  const currentYear = getYear(new Date());
  const currentMonth = getMonth(new Date()) + 1; // 1-12

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  const [reportStats, setReportStats] = useState<ReportPageStats | null>(null);
  const [yearlySummary, setYearlySummary] = useState<MonthlyFinancialSummary[]>([]);
  const [categorySummary, setCategorySummary] = useState<CategoryMonthlySummary[]>([]);
  const [activePieIndex, setActivePieIndex] = useState(0);

  // TODO: Replace with actual API calls using selectedYear and selectedMonth
  useEffect(() => {
    setReportStats(getPlaceholderReportStats(selectedYear, selectedMonth, currencyCode));
    setYearlySummary(getPlaceholderYearlySummary(selectedYear, currencyCode));
    setCategorySummary(getPlaceholderCategorySummary(selectedYear, selectedMonth, currencyCode));
  }, [selectedYear, selectedMonth, currencyCode]);
  
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i).reverse();
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: format(new Date(selectedYear, i), 'MMMM', { locale: dateFnsLocale }),
  }));

  const yearlyChartConfig = {
    income: { label: t('incomeLabel'), color: "hsl(var(--chart-2))" },
    expense: { label: t('expenseLabel'), color: "hsl(var(--chart-1))" },
  } satisfies ChartConfig;

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
  
  const renderActiveShape = (props: any) => {
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


  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="font-headline text-3xl font-bold text-foreground flex items-center">
          <FileSignature className="mr-3 h-8 w-8 text-primary" />
          {t('generalReportPageTitle')}
        </h1>

        {/* Filters */}
        <Card className="shadow-md">
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

        {/* Stats Block */}
        {reportStats && (
          <Card className="shadow-md">
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
        )}
        
        {/* Yearly Income/Expense Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-primary"/>
                {t('yearlyIncomeExpenseChartTitle')} - {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] w-full">
            <ChartContainer config={yearlyChartConfig} className="h-full w-full">
              <BarChart data={yearlySummary} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickFormatter={(value) => new Intl.NumberFormat(language, { notation: 'compact', compactDisplay: 'short' }).format(value / 100)} tickLine={false} axisLine={false} />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" hideLabel 
                    formatter={(value, name) => {
                        const config = yearlyChartConfig[name as keyof typeof yearlyChartConfig];
                        const color = config?.color;
                        return (
                            <div className="flex items-center gap-2">
                                <div 
                                    className="h-2.5 w-2.5 rounded-full" 
                                    style={{ backgroundColor: color }} 
                                />
                                <div>
                                    <p className="font-medium text-foreground">{config?.label}</p>
                                    <p className="text-muted-foreground">
                                        <CurrencyDisplay amountInCents={value as number} currencyCode={currencyCode}/>
                                    </p>
                                </div>
                            </div>
                        );
                    }}
                  />}
                />
                <Legend />
                <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Monthly Category Summary Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center">
                <PieChartIcon className="mr-2 h-5 w-5 text-primary"/>
                {t('monthlyCategorySummaryChartTitle')} - {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy', { locale: dateFnsLocale })}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] w-full flex justify-center items-center">
            {categorySummary.length > 0 ? (
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
                        <Cell key={`cell-${index}`} fill={entry.color || categoryChartConfig[entry.categoryName]?.color} />
                        ))}
                    </Pie>
                    </PieChart>
                </ChartContainer>
             ) : (
                <p className="text-muted-foreground">{t('noDataAvailable')}</p>
             )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

