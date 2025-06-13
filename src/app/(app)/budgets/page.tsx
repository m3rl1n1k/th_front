
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from '@/lib/getTranslations';
import { getBudgets, getMainCategories, getTransactions, getSubCategories, getUserSettings } from '@/lib/actions';
import { BudgetList, type AugmentedBudget } from './_components/BudgetList';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Transaction, SubCategory, Budget, MainCategory } from '@/lib/definitions';
import { cookies } from 'next/headers'; // Import cookies

export default async function BudgetsPage() {
  const cookieStore = cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const t = await getTranslations(locale);
  const tb = t.budgetsPage;
  const userSettings = await getUserSettings();
  const defaultCurrency = userSettings?.defaultCurrency || 'USD';

  const budgets: Budget[] = await getBudgets();
  const mainCategories: MainCategory[] = await getMainCategories();
  const transactions: Transaction[] = await getTransactions();
  const subCategories: SubCategory[] = await getSubCategories();

  const mainCategoryMap = new Map(mainCategories.map(mc => [mc.id, mc]));
  const subCategoryMap = new Map(subCategories.map(sc => [sc.id, sc]));

  const augmentedBudgets: AugmentedBudget[] = budgets.map(budget => {
    let actualSpent = 0;
    const budgetSubCategory = subCategoryMap.get(budget.subCategoryId);
    let parentMainCategoryName = 'N/A';

    if (budgetSubCategory) {
      const parentMainCategory = mainCategoryMap.get(budgetSubCategory.mainCategoryId);
      parentMainCategoryName = parentMainCategory?.name || 'N/A';

      const relevantTransactions = transactions.filter(transaction => {
        if (transaction.type !== 'Expense') return false;
        if (transaction.subCategoryId !== budget.subCategoryId) return false;

        const txDate = new Date(transaction.createdAt);
        const txMonth = txDate.getMonth() + 1;
        const txYear = txDate.getFullYear();

        return txMonth === budget.month && txYear === budget.year;
      });
      actualSpent = relevantTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    }
    
    return {
      ...budget,
      actualSpent,
      subCategoryName: budgetSubCategory?.name || 'N/A',
      parentMainCategoryName: parentMainCategoryName,
    };
  });

  return (
    <>
      <PageHeader title={tb.title} description={tb.description}>
        <Button asChild>
          <Link href="/budgets/new">
            <PlusCircle className="mr-2 h-4 w-4" /> {tb.addBudget}
          </Link>
        </Button>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <BudgetList 
          initialBudgets={augmentedBudgets}
          translations={tb}
          locale={locale}
          defaultCurrencyCode={defaultCurrency}
        />
      </Suspense>
    </>
  );
}
