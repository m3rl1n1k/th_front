
'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  type ChartConfig
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart as PieChartIcon } from 'lucide-react';

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
  locale: string; // Added locale
  currencyCode: string; // Added currencyCode
  localStorageKey: string;
  initialVisible: boolean;
}

export function DashboardExpenseChart({ 
  chartData, 
  chartConfig, 
  translations,
  locale, // Use locale
  currencyCode, // Use currencyCode
  localStorageKey,
  initialVisible 
}: DashboardExpenseChartProps) {
  const [isVisible, setIsVisible] = useState(initialVisible);

  useEffect(() => {
    const storedSetting = typeof window !== 'undefined' ? localStorage.getItem(localStorageKey) : null;
    if (storedSetting !== null) {
      setIsVisible(storedSetting === 'true');
    } else {
      setIsVisible(initialVisible);
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === localStorageKey && event.newValue !== null) {
        setIsVisible(event.newValue === 'true');
      } else if (event.key === 'dashboard_settings_updated') {
        const freshStoredSetting = localStorage.getItem(localStorageKey);
        if (freshStoredSetting !== null) {
          setIsVisible(freshStoredSetting === 'true');
        }
      }
    };

    if (typeof window !== 'undefined') {
        window.addEventListener('storage', handleStorageChange);
    }
    return () => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('storage', handleStorageChange);
        }
    };
  }, [localStorageKey, initialVisible]);

  const totalExpenses = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.totalAmount, 0);
  }, [chartData]);

  if (!isVisible) {
    return null;
  }

  if (chartData.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChartIcon className="h-6 w-6 mr-2 text-primary" />
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
          <PieChartIcon className="h-6 w-6 mr-2 text-primary" />
          {translations.spendingByCategory || "Spending by Category"}
        </CardTitle>
        <CardDescription>
          {translations.spendingByCategoryDescription || "Visual representation of your expenses across different categories."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full max-w-xs sm:max-w-sm md:max-w-md">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <RechartsTooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const formattedAmount = Number(value).toLocaleString(locale, { // Use locale
                        style: 'currency',
                        currency: currencyCode, // Use currencyCode
                        currencyDisplay: 'code', // Use ISO code
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      });
                      return (
                        <div className="flex flex-col">
                          <span className="font-medium">{name}</span>
                          <span className="text-muted-foreground">{formattedAmount}</span>
                        </div>
                      );
                    }}
                    hideLabel 
                    hideIndicator={false}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="totalAmount"
                nameKey="mainCategoryName"
                cx="50%"
                cy="50%"
                innerRadius={70} 
                outerRadius={110}
                labelLine={false}
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                ))}
              </Pie>
              <text
                x="50%"
                y="45%" 
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-2xl font-semibold"
              >
                {Number(totalExpenses).toLocaleString(locale, { style: 'currency', currency: currencyCode, currencyDisplay: 'code', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </text>
              <text
                x="50%"
                y="45%"
                textAnchor="middle"
                dominantBaseline="middle"
                dy="20" 
                className="fill-muted-foreground text-sm"
              >
                {translations.totalExpensesLabel || "Total"}
              </text>
              <Legend content={<ChartLegendContent nameKey="mainCategoryName" />} verticalAlign="bottom" wrapperStyle={{paddingTop: "20px"}}/>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
