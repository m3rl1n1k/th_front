
'use client';

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList } from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart2, CalendarDays } from 'lucide-react';
import type { Transaction, MainCategory, SubCategory } from '@/lib/definitions';
import type { ExpenseBySubCategoryData } from '../page';
import { getMonth, getYear, format } from 'date-fns';
import { getMonthName } from '@/lib/utils';


interface ExpenseBySubCategoryBarChartProps {
  allTransactions: Transaction[];
  mainCategories: MainCategory[];
  subCategories: SubCategory[];
  translations: {
    chartTitle: string;
    selectMonthPlaceholder: string;
    noDataForMonth: string;
    totalLabel: string;
  };
  locale: string;
}

export function ExpenseBySubCategoryBarChart({
  allTransactions,
  mainCategories,
  subCategories,
  translations,
  locale,
}: ExpenseBySubCategoryBarChartProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString()); // Default to current month (1-12)
  const currentYear = new Date().getFullYear();

  const subCategoryMap = useMemo(() => new Map(subCategories.map(sc => [sc.id, sc])), [subCategories]);
  const mainCategoryMap = useMemo(() => new Map(mainCategories.map(mc => [mc.id, mc])), [mainCategories]);

  const { chartData, chartConfig } = useMemo(() => {
    const monthNum = parseInt(selectedMonth, 10) -1; // 0-indexed

    const filteredExpenses = allTransactions.filter(tx => {
      const txDate = new Date(tx.createdAt);
      return tx.type === 'Expense' && getMonth(txDate) === monthNum && getYear(txDate) === currentYear;
    });

    const expensesBySubCat: Record<string, { totalAmount: number; subCatName: string; mainCatName: string; fill: string }> = {};

    filteredExpenses.forEach(tx => {
      if (tx.subCategoryId) {
        const subCat = subCategoryMap.get(tx.subCategoryId);
        if (subCat) {
          const mainCat = mainCategoryMap.get(subCat.mainCategoryId);
          if (!expensesBySubCat[subCat.id]) {
            expensesBySubCat[subCat.id] = {
              totalAmount: 0,
              subCatName: subCat.name,
              mainCatName: mainCat?.name || 'N/A',
              fill: subCat.color || mainCat?.color || 'hsl(var(--chart-3))',
            };
          }
          expensesBySubCat[subCat.id].totalAmount += tx.amount;
        }
      } else { // Uncategorized
        if (!expensesBySubCat['uncategorized']) {
            expensesBySubCat['uncategorized'] = {
                totalAmount: 0,
                subCatName: 'Uncategorized',
                mainCatName: 'N/A',
                fill: 'hsl(var(--muted))'
            };
        }
        expensesBySubCat['uncategorized'].totalAmount += tx.amount;
      }
    });
    
    const finalChartData: ExpenseBySubCategoryData[] = Object.values(expensesBySubCat)
        .map(d => ({ ...d, subCategoryName: d.subCatName, totalAmount: parseFloat(d.totalAmount.toFixed(2))}))
        .sort((a, b) => b.totalAmount - a.totalAmount);

    const dynamicChartConfig: ChartConfig = {};
    finalChartData.forEach(item => {
      dynamicChartConfig[item.subCategoryName] = { // Use subCategoryName as key for config
        label: item.subCategoryName,
        color: item.fill,
      };
    });
     dynamicChartConfig["totalAmount"] = { 
        label: translations.totalLabel,
        color: "hsl(var(--foreground))",
    };


    return { chartData: finalChartData, chartConfig: dynamicChartConfig };
  }, [selectedMonth, currentYear, allTransactions, subCategoryMap, mainCategoryMap, translations.totalLabel]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString(locale, { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }); // Assuming USD
  };

  const monthsForSelect = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: getMonthName(i + 1, locale),
  }));

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="flex items-center">
              <BarChart2 className="h-6 w-6 mr-2 text-primary" />
              {translations.chartTitle}
            </CardTitle>
            <CardDescription>
              {`${getMonthName(parseInt(selectedMonth), locale)} ${currentYear}`}
            </CardDescription>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <CalendarDays className="h-4 w-4 mr-2 opacity-50" />
              <SelectValue placeholder={translations.selectMonthPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {monthsForSelect.map(month => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={formatCurrency} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="subCategoryName"
                  type="category"
                  width={120}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <RechartsTooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  content={
                    <ChartTooltipContent
                        nameKey="subCategoryName" // tells tooltip to use subCategoryName for the label
                        formatter={(value, name, entry) => {
                           const itemConfig = chartConfig[name as keyof typeof chartConfig] as {label: string, color: string} | undefined;
                           return (
                            <div className="flex flex-col">
                                <span className="font-medium" style={{color: itemConfig?.color}}>{itemConfig?.label || name}</span>
                                <span className="text-muted-foreground">{formatCurrency(Number(value))}</span>
                            </div>
                           )
                        }}
                        hideLabel={true} // We will show label inside formatter
                    />
                  }
                />
                <Bar dataKey="totalAmount" radius={[4, 4, 0, 0]}>
                   {chartData.map((entry, index) => (
                    <LabelList
                      key={`label-${index}`}
                      dataKey="totalAmount"
                      position="right"
                      offset={8}
                      className="fill-foreground"
                      fontSize={12}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <p className="text-center text-muted-foreground py-10">{translations.noDataForMonth}</p>
        )}
      </CardContent>
    </Card>
  );
}
