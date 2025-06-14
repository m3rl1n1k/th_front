
import { PageHeader } from '@/components/shared/PageHeader';
import { BudgetForm } from '../../_components/BudgetForm';
import { getBudgets, updateBudget, getMainCategories, getSubCategories } from '@/lib/actions';
import { notFound } from 'next/navigation';
import type { Budget, MainCategory, SubCategory } from '@/lib/definitions';
import { getTranslations } from '@/lib/getTranslations';
import { cookies } from 'next/headers'; // Import cookies
import { Button } from '@/components/ui/button';
import Link from 'next/link';

async function getBudgetById(id: string): Promise<Budget | null> {
  const budgets = await getBudgets(); 
  const budget = budgets.find(b => b.id === id);
  return budget || null;
}

export default async function EditBudgetPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const t = await getTranslations(locale);
  const tb = t.budgetsPage;

  const budget = await getBudgetById(id);
  const mainCategories = await getMainCategories();
  const subCategories = await getSubCategories();

  if (!budget) {
    notFound();
  }
  
  if (mainCategories.length === 0 || subCategories.length === 0) {
    return (
       <>
        <PageHeader title={tb.editBudgetTitle} description={tb.editBudgetDescription} />
        <div className="max-w-2xl mx-auto p-6 border rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-semibold mb-2">Cannot Edit Budget</h2>
           <p className="text-muted-foreground">Required category data is missing. Please ensure main and sub-categories exist.</p>
           <div className="mt-4 space-x-2">
            <Button asChild variant="outline"><Link href="/categories/new">Add Category</Link></Button>
            <Button asChild><Link href="/budgets">Back to Budgets</Link></Button>
          </div>
        </div>
      </>
    )
  }

  const handleSubmit = async (data: Omit<Budget, 'id' | 'userId' | 'createdAt'>) => {
    'use server';
    return updateBudget(id, data);
  };

  return (
    <>
      <PageHeader title={tb.editBudgetTitle} description={tb.editBudgetDescription} />
      <BudgetForm
        initialData={budget}
        onSubmitAction={handleSubmit}
        mainCategories={mainCategories}
        subCategories={subCategories}
        translations={tb}
        locale={locale}
      />
    </>
  );
}
