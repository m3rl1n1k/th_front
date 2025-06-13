
import { PageHeader } from '@/components/shared/PageHeader';
import { getTranslations } from '@/lib/getTranslations';
import { getTransactions, getMainCategories, getSubCategories, getWallets, getUserSettings } from '@/lib/actions';
import type { Transaction, MainCategory, SubCategory, Wallet, UserSettings } from '@/lib/definitions';
import type { ChartConfig } from '@/components/ui/chart';
import { DashboardExpenseChart } from './_components/DashboardExpenseChart';
import { AverageExpenseCard } from './_components/AverageExpenseCard'; 
import { StatCard } from './_components/StatCard';
import { DashboardRecentActivitySection } from './_components/DashboardRecentActivitySection';
import { dashboardVisibilityLocalStorageKeys } from '@/app/(app)/settings/_components/SettingsForm';
import { differenceInDays, differenceInCalendarMonths } from 'date-fns';
import { cookies } from 'next/headers'; // Import cookies

// Mock data - replace with actual data fetching
const summaryData = {
  totalBalance: 12530.75,
  totalIncome: 5200.00,
  totalExpenses: 2800.50,
};

interface ExpenseByCategory {
  mainCategoryName: string;
  totalAmount: number;
  fill: string;
}

export default async function DashboardPage() {
  const cookieStore = cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
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
        <StatCard 
            title={td.totalBalance} 
            value={summaryData.totalBalance} 
            iconName="DollarSign" 
            currency 
            locale={locale} 
            dataAiHint="piggy bank"
            localStorageKey={dashboardVisibilityLocalStorageKeys.showTotalBalanceCard}
            initialVisible={userSettings?.showTotalBalanceCard !== false}
        />
        <StatCard 
            title={td.monthlyIncome} 
            value={summaryData.totalIncome} 
            iconName="Users" 
            currency 
            locale={locale} 
            dataAiHint="money rain"
            localStorageKey={dashboardVisibilityLocalStorageKeys.showMonthlyIncomeCard}
            initialVisible={userSettings?.showMonthlyIncomeCard !== false}
        />
        <StatCard 
            title={td.monthlyExpenses} 
            value={summaryData.totalExpenses} 
            iconName="CreditCard" 
            currency 
            locale={locale} 
            dataAiHint="empty wallet"
            localStorageKey={dashboardVisibilityLocalStorageKeys.showMonthlyExpensesCard}
            initialVisible={userSettings?.showMonthlyExpensesCard !== false}
        />
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
            localStorageKey={dashboardVisibilityLocalStorageKeys.showAverageSpendingCard}
            initialVisible={userSettings?.showAverageSpendingCard !== false}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <DashboardExpenseChart
            chartData={chartData}
            chartConfig={chartConfig}
            translations={td}
            localStorageKey={dashboardVisibilityLocalStorageKeys.showExpenseChartCard}
            initialVisible={userSettings?.showExpenseChartCard !== false}
        />
        <DashboardRecentActivitySection
            transactions={recentTransactions}
            wallets={wallets}
            subCategories={subCategories}
            mainCategories={mainCategories}
            translations={td}
            localStorageKey={dashboardVisibilityLocalStorageKeys.showRecentActivityCard}
            initialVisible={userSettings?.showRecentActivityCard !== false}
        />
      </div>
    </>
  );
}
