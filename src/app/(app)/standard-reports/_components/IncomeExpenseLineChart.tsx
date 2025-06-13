
'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  type ChartConfig
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart as LineChartIcon } from 'lucide-react';
import type { MonthlyIncomeExpenseData } from '../page';
import { useTheme } from 'next-themes'; // To get theme for colors if needed

interface IncomeExpenseLineChartProps {
  data: MonthlyIncomeExpenseData[];
  translations: {
    chartTitle: string;
    incomeLabel: string;
    expenseLabel: string;
    currentYearLabel: string;
  };
  locale: string;
}

export function IncomeExpenseLineChart({ data, translations, locale }: IncomeExpenseLineChartProps) {
  const { resolvedTheme } = useTheme();

  const chartConfig = {
    income: {
      label: translations.incomeLabel,
      color: 'hsl(var(--chart-2))', // Example color, adjust from globals.css or define new
    },
    expense: {
      label: translations.expenseLabel,
      color: 'hsl(var(--chart-1))', // Example color
    },
  } satisfies ChartConfig;

  const formatCurrency = (value: number) => {
    return value.toLocaleString(locale, { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }); // Assuming USD for now
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <LineChartIcon className="h-6 w-6 mr-2 text-primary" />
          {translations.chartTitle}
        </CardTitle>
        <CardDescription>{translations.currentYearLabel}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={80}
              />
              <RechartsTooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {(chartConfig[name as keyof typeof chartConfig] as { label: string })?.label || name}
                        </span>
                        <span className="text-muted-foreground">{formatCurrency(Number(value))}</span>
                      </div>
                    )}
                    hideLabel
                  />
                }
              />
              <Legend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="income"
                stroke={chartConfig.income.color}
                strokeWidth={2.5}
                dot={{ r: 4, fill: chartConfig.income.color, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                stroke={chartConfig.expense.color}
                strokeWidth={2.5}
                dot={{ r: 4, fill: chartConfig.expense.color, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
