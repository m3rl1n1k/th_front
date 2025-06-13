
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from '@/lib/getTranslations';
import { getBudgets, getMainCategories } from '@/lib/actions';
import { BudgetList } from './_components/BudgetList';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default async function BudgetsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations(locale);
  const tb = t.budgetsPage;

  // For now, fetch all budgets. We can add month/year filters later.
  const budgets = await getBudgets();
  const mainCategories = await getMainCategories();

  return (
    <>
      <PageHeader title={tb.title} description={tb.description}>
        <Button asChild>
          <Link href={`/${locale}/budgets/new`}>
            <PlusCircle className="mr-2 h-4 w-4" /> {tb.addBudget}
          </Link>
        </Button>
      </PageHeader>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <BudgetList 
          initialBudgets={budgets} 
          mainCategories={mainCategories} 
          translations={tb}
          locale={locale}
        />
      </Suspense>
    </>
  );
}
