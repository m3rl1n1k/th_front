
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from '@/lib/getTranslations';
import { getBudgets, getMainCategories, getTransactions, getSubCategories } from '@/lib/actions';
import { BudgetList, type AugmentedBudget } from './_components/BudgetList';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Transaction, SubCategory, Budget, MainCategory } from '@/lib/definitions';

export default async function BudgetsPage({ /* params: { locale } */ }: { /* params: { locale: string } */ }) {
  const locale = 'en'; // Hardcode locale
  const t = await getTranslations(locale);
  const tb = t.budgetsPage;

  const budgets: Budget[] = await getBudgets();
  const mainCategories: MainCategory[] = await getMainCategories();
  const transactions: Transaction[] = await getTransactions();
  const subCategories: SubCategory[] = await getSubCategories();

  const mainCategoryMap = new Map(mainCategories.map(mc => [mc.id, mc]));
  const subCategoryToMainCategoryMap = new Map(subCategories.map(sc => [sc.id, sc.mainCategoryId]));

  const augmentedBudgets: AugmentedBudget[] = budgets.map(budget => {
    let actualSpent = 0;
    const budgetMainCategory = mainCategoryMap.get(budget.mainCategoryId);

    if (budgetMainCategory) {
      const relevantTransactions = transactions.filter(transaction => {
        if (transaction.type !== 'Expense') return false;

        const mainCategoryIdForTx = subCategoryToMainCategoryMap.get(transaction.subCategoryId);
        if (mainCategoryIdForTx !== budget.mainCategoryId) return false;

        const txDate = new Date(transaction.createdAt);
        const txMonth = txDate.getMonth() + 1; // getMonth is 0-indexed
        const txYear = txDate.getFullYear();

        return txMonth === budget.month && txYear === budget.year;
      });
      actualSpent = relevantTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    }
    
    return {
      ...budget,
      actualSpent,
      mainCategoryName: budgetMainCategory?.name || 'N/A',
    };
  });

  return (
    <>
      <PageHeader title={tb.title} description={tb.description}>
        <Button asChild>
          <Link href="/budgets/new"> {/* Non-prefixed link */}
            <PlusCircle className="mr-2 h-4 w-4" /> {tb.addBudget}
          </Link>
        </Button>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <BudgetList 
          initialBudgets={augmentedBudgets}
          translations={tb}
          locale={locale}
        />
      </Suspense>
    </>
  );
}
