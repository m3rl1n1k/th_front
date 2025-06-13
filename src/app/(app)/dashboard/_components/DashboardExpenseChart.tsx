
'use client';

import React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingDown } from 'lucide-react';

interface ExpenseByCategory {
  mainCategoryName: string;
  totalAmount: number;
  fill: string;
}

interface DashboardExpenseChartProps {
  chartData: ExpenseByCategory[];
  chartConfig: ChartConfig;
  translations: {
    spendingByCategory?: string;
    spendingByCategoryDescription?: string;
    noExpenseData?: string;
    totalExpensesLabel?: string;
  };
}

export function DashboardExpenseChart({ chartData, chartConfig, translations }: DashboardExpenseChartProps) {
  if (chartData.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingDown className="h-6 w-6 mr-2 text-destructive" />
            {translations.spendingByCategory || "Spending by Category"}
          </CardTitle>
          <CardDescription>
            {translations.spendingByCategoryDescription || "Visual representation of your expenses across different categories."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-10">{translations.noExpenseData || "No expense data available to display chart."}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingDown className="h-6 w-6 mr-2 text-destructive" />
          {translations.spendingByCategory || "Spending by Category"}
        </CardTitle>
        <CardDescription>
          {translations.spendingByCategoryDescription || "Visual representation of your expenses across different categories."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" margin={{ right: 20, left: 30, bottom: 5, top: 5 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `$${value.toLocaleString()}`} />
              <YAxis
                dataKey="mainCategoryName"
                type="category"
                tickLine={false}
                axisLine={false}
                width={100}
                style={{ fontSize: '0.75rem' }}
                interval={0}
              />
              <RechartsTooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent
                  formatter={(value, name, props) => {
                    const chartItemPayload = props.payload && props.payload[0] ? props.payload[0].payload : {};
                    return (
                      <div className="flex flex-col">
                        <span className="font-medium">{chartItemPayload.mainCategoryName}</span>
                        <span className="text-muted-foreground">{`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
                      </div>
                    )
                  }}
                  hideIndicator
                />}
              />
              <Bar dataKey="totalAmount" radius={4}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
