
import { PageHeader } from '@/components/shared/PageHeader';
import { getTranslations } from '@/lib/getTranslations';
import { cookies } from 'next/headers';
import { getTransactions, getMainCategories, getSubCategories, getUserSettings } from '@/lib/actions';
import type { Transaction, MainCategory, SubCategory } from '@/lib/definitions';
import { IncomeExpenseLineChart } from './_components/IncomeExpenseLineChart';
import { ExpenseBySubCategoryBarChart } from './_components/ExpenseBySubCategoryBarChart';
import { format, getYear, getMonth, startOfMonth, endOfMonth } from 'date-fns';

export interface MonthlyIncomeExpenseData {
  month: string;
  year: number;
  income: number;
  expense: number;
}

export interface ExpenseBySubCategoryData {
  subCategoryName: string;
  mainCategoryName: string;
  totalAmount: number;
  fill: string;
}

export default async function StandardReportsPage() {
  const cookieStore = cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const t = await getTranslations(locale);
  const tsr = t.standardReportsPage;
  const userSettings = await getUserSettings();
  const defaultCurrency = userSettings?.defaultCurrency || 'USD';

  const transactions: Transaction[] = await getTransactions();
  const mainCategories: MainCategory[] = await getMainCategories();
  const subCategories: SubCategory[] = await getSubCategories();

  const currentYear = getYear(new Date());
  const monthlyIncomeExpenseData: MonthlyIncomeExpenseData[] = [];

  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(currentYear, i, 1);
    const monthName = format(monthDate, 'MMM', { locale: t.dateFnsLocale });
    let monthIncome = 0;
    let monthExpense = 0;

    transactions.forEach(tx => {
      const txDate = new Date(tx.createdAt);
      if (getYear(txDate) === currentYear && getMonth(txDate) === i) {
        if (tx.type === 'Income') {
          monthIncome += tx.amount;
        } else if (tx.type === 'Expense') {
          monthExpense += tx.amount;
        }
      }
    });
    monthlyIncomeExpenseData.push({ month: monthName, year: currentYear, income: monthIncome, expense: monthExpense });
  }

  return (
    <>
      <PageHeader title={tsr.title} description={tsr.description} />
      <div className="grid gap-6 lg:grid-cols-1">
        <IncomeExpenseLineChart
          data={monthlyIncomeExpenseData}
          translations={{
            chartTitle: tsr.incomeExpenseChartTitle,
            incomeLabel: tsr.incomeLabel,
            expenseLabel: tsr.expenseLabel,
            currentYearLabel: tsr.currentYearLabel,
          }}
          locale={locale}
          currencyCode={defaultCurrency}
        />
        <ExpenseBySubCategoryBarChart
          allTransactions={transactions}
          mainCategories={mainCategories}
          subCategories={subCategories}
          translations={{
            chartTitle: tsr.expenseBySubCategoryChartTitle,
            selectMonthPlaceholder: tsr.selectMonthPlaceholder,
            noDataForMonth: tsr.noDataForMonth,
            totalLabel: tsr.totalLabel,
          }}
          locale={locale}
          currencyCode={defaultCurrency}
        />
      </div>
    </>
  );
}
