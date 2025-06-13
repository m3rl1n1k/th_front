
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Users, CreditCard, Activity, TrendingDown } from 'lucide-react';
import Image from 'next/image';
import { getTranslations } from '@/lib/getTranslations';
import { getTransactions, getMainCategories, getSubCategories } from '@/lib/actions';
import type { Transaction, MainCategory, SubCategory } from '@/lib/definitions';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';


// Mock data - replace with actual data fetching
const summaryData = {
  totalBalance: 12530.75,
  totalIncome: 5200.00,
  totalExpenses: 2800.50,
  recentTransactions: 5,
};

const StatCard = ({ title, value, icon: Icon, currency = false, dataAiHint }: { title: string; value: string | number; icon: React.ElementType; currency?: boolean, dataAiHint?: string }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-5 w-5 text-primary" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {currency && '$'}{typeof value === 'number' ? value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : value}
      </div>
      {dataAiHint && <div className="text-xs text-muted-foreground hidden" data-ai-hint={dataAiHint}>Hint for AI image generation</div>}
    </CardContent>
  </Card>
);

interface ExpenseByCategory {
  mainCategoryName: string;
  totalAmount: number;
  fill: string;
}

export default async function DashboardPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations(locale);
  const td = t.dashboard; 

  const transactions = await getTransactions();
  const mainCategories = await getMainCategories();
  const subCategories = await getSubCategories();

  const mainCategoryMap = new Map(mainCategories.map(mc => [mc.id, mc]));
  const subCategoryToMainCategoryMap = new Map(subCategories.map(sc => [sc.id, sc.mainCategoryId]));

  const expensesByMainCategory: Record<string, { totalAmount: number, name: string, color: string }> = {};

  transactions.forEach(transaction => {
    if (transaction.type === 'Expense') {
      const mainCategoryId = subCategoryToMainCategoryMap.get(transaction.subCategoryId);
      if (mainCategoryId) {
        const mainCategory = mainCategoryMap.get(mainCategoryId);
        if (mainCategory) {
          if (!expensesByMainCategory[mainCategoryId]) {
            expensesByMainCategory[mainCategoryId] = { totalAmount: 0, name: mainCategory.name, color: mainCategory.color };
          }
          expensesByMainCategory[mainCategoryId].totalAmount += transaction.amount;
        }
      }
    }
  });

  const chartData: ExpenseByCategory[] = Object.values(expensesByMainCategory).map(item => ({
    mainCategoryName: item.name,
    totalAmount: parseFloat(item.totalAmount.toFixed(2)), // Ensure two decimal places for currency
    fill: item.color,
  })).sort((a, b) => b.totalAmount - a.totalAmount); // Sort by amount descending


  const chartConfig = {} as ChartConfig;
  chartData.forEach(item => {
    chartConfig[item.mainCategoryName] = {
      label: item.mainCategoryName,
      color: item.fill,
    };
  });
  // Add a generic key for the Bar dataKey if needed, or use mainCategoryName directly
  chartConfig["totalAmount"] = {
    label: td.totalExpenses || "Total Expenses", // Use translation
    color: "hsl(var(--primary))", // Default bar color, will be overridden by 'fill' in Bar component
  };


  return (
    <>
      <PageHeader title={td.title} description={td.description} />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title={td.totalBalance} value={summaryData.totalBalance} icon={DollarSign} currency dataAiHint="piggy bank" />
        <StatCard title={td.monthlyIncome} value={summaryData.totalIncome} icon={Users} currency dataAiHint="money rain" />
        <StatCard title={td.monthlyExpenses} value={summaryData.totalExpenses} icon={CreditCard} currency dataAiHint="empty wallet" />
        <StatCard title={td.recentTransactions} value={summaryData.recentTransactions} icon={Activity} dataAiHint="graph chart" />
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingDown className="h-6 w-6 mr-2 text-destructive" />
              {td.spendingByCategory || "Spending by Category"}
            </CardTitle>
            <CardDescription>
              {td.spendingByCategoryDescription || "Visual representation of your expenses across different categories."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} layout="vertical" margin={{ right: 20, left: 30 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                    <XAxis type="number"  tickFormatter={(value) => `$${value.toLocaleString()}`} />
                    <YAxis 
                      dataKey="mainCategoryName" 
                      type="category" 
                      tickLine={false} 
                      axisLine={false} 
                      width={100}
                      style={{ fontSize: '0.75rem' }}
                      interval={0}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      content={<ChartTooltipContent 
                                  formatter={(value, name, props) => {
                                    const { payload } = props;
                                    return (
                                      <div className="flex flex-col">
                                        <span className="font-medium">{payload.mainCategoryName}</span>
                                        <span className="text-muted-foreground">{`$${Number(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}</span>
                                      </div>
                                    )
                                  }}
                                  hideIndicator
                                />}
                    />
                    <Bar dataKey="totalAmount" radius={4}>
                      {chartData.map((entry, index) => (
                        <rect key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-10">{td.noExpenseData || "No expense data available to display chart."}</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{td.recentActivity}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Placeholder for recent transactions list or chart.</p>
            <Image 
              src="https://placehold.co/600x300.png" 
              alt="Recent Activity Placeholder" 
              width={600} 
              height={300} 
              className="mt-4 rounded-md object-cover"
              data-ai-hint="financial report" 
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
