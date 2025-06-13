
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Users, CreditCard, CalendarClock } from 'lucide-react'; 
import { getTranslations } from '@/lib/getTranslations';
import { getTransactions, getMainCategories, getSubCategories, getWallets, getUserSettings } from '@/lib/actions';
import type { Transaction, MainCategory, SubCategory, Wallet, UserSettings } from '@/lib/definitions';
import type { ChartConfig } from '@/components/ui/chart';
import { DashboardExpenseChart } from './_components/DashboardExpenseChart';
import { RecentActivityList } from './_components/RecentActivityList';
import { AverageExpenseCard } from './_components/AverageExpenseCard'; 
import { differenceInDays, differenceInCalendarMonths } from 'date-fns';


// Mock data - replace with actual data fetching
const summaryData = {
  totalBalance: 12530.75,
  totalIncome: 5200.00,
  totalExpenses: 2800.50,
};

const StatCard = ({ title, value, icon: Icon, currency = false, dataAiHint, locale = 'en' }: { title: string; value: string | number; icon: React.ElementType; currency?: boolean, dataAiHint?: string, locale?: string }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-5 w-5 text-primary" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {currency ? Number(value).toLocaleString(locale, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2}) : (typeof value === 'number' ? value.toLocaleString(locale) : value)}
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
  const userSettings = await getUserSettings();

  const transactions = await getTransactions();
  const mainCategories = await getMainCategories();
  const subCategories = await getSubCategories();
  const wallets = await getWallets();

  const mainCategoryMap = new Map(mainCategories.map(mc => [mc.id, mc]));
  const subCategoryToMainCategoryMap = new Map(subCategories.map(sc => [sc.id, sc.mainCategoryId]));

  const expensesByMainCategory: Record<string, { totalAmount: number, name: string, color: string }> = {};
  const expenseTransactions = transactions.filter(tx => tx.type === 'Expense');

  expenseTransactions.forEach(transaction => {
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
    totalAmount: parseFloat(item.totalAmount.toFixed(2)),
    fill: item.color,
  })).sort((a, b) => b.totalAmount - a.totalAmount);


  const chartConfig = {} as ChartConfig;
  chartData.forEach(item => {
    chartConfig[item.mainCategoryName] = {
      label: item.mainCategoryName,
      color: item.fill,
    };
  });
  chartConfig["totalAmount"] = { 
    label: td.totalExpensesLabel || "Total Expenses",
    color: "hsl(var(--primary))", 
  };

  const recentTransactions = transactions.slice(0, 10);

  let avgDailyExpense = 0;
  let avgWeeklyExpense = 0;
  let avgMonthlyExpense = 0;

  if (expenseTransactions.length > 0) {
    const expenseDates = expenseTransactions.map(tx => new Date(tx.createdAt)).sort((a, b) => a.getTime() - b.getTime());
    const firstExpenseDate = expenseDates[0];
    const lastExpenseDate = expenseDates[expenseTransactions.length - 1];
    const totalExpensesSum = expenseTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    const totalDaysActive = Math.max(1, differenceInDays(lastExpenseDate, firstExpenseDate) + 1);
    const totalWeeksActive = Math.max(1, Math.ceil(totalDaysActive / 7));
    const totalMonthsActive = Math.max(1, differenceInCalendarMonths(lastExpenseDate, firstExpenseDate) + 1);
    
    avgDailyExpense = totalExpensesSum / totalDaysActive;
    avgWeeklyExpense = totalExpensesSum / totalWeeksActive;
    avgMonthlyExpense = totalExpensesSum / totalMonthsActive;
  }

  return (
    <>
      <PageHeader title={td.title} description={td.description} />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {userSettings?.showTotalBalanceCard !== false && (
          <StatCard title={td.totalBalance} value={summaryData.totalBalance} icon={DollarSign} currency locale={locale} dataAiHint="piggy bank" />
        )}
        {userSettings?.showMonthlyIncomeCard !== false && (
          <StatCard title={td.monthlyIncome} value={summaryData.totalIncome} icon={Users} currency locale={locale} dataAiHint="money rain" />
        )}
        {userSettings?.showMonthlyExpensesCard !== false && (
          <StatCard title={td.monthlyExpenses} value={summaryData.totalExpenses} icon={CreditCard} currency locale={locale} dataAiHint="empty wallet" />
        )}
        {userSettings?.showAverageSpendingCard !== false && (
          <AverageExpenseCard 
              avgDaily={avgDailyExpense}
              avgWeekly={avgWeeklyExpense}
              avgMonthly={avgMonthlyExpense}
              locale={locale}
              translations={{
                  averageSpendingTitle: td.averageSpendingTitle,
                  dailyLabel: td.dailyLabel,
                  weeklyLabel: td.weeklyLabel,
                  monthlyLabel: td.monthlyLabel,
              }}
          />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {userSettings?.showExpenseChartCard !== false && (
          <DashboardExpenseChart
            chartData={chartData}
            chartConfig={chartConfig}
            translations={td}
          />
        )}

        {userSettings?.showRecentActivityCard !== false && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>{td.recentActivity}</CardTitle>
              <CardDescription>{td.recentActivityDescription || "Latest financial movements."}</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentActivityList
                transactions={recentTransactions}
                wallets={wallets}
                subCategories={subCategories}
                mainCategories={mainCategories}
                translations={td} 
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
