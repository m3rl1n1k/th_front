
import { PageHeader } from '@/components/shared/PageHeader';
import { BudgetForm } from '../../_components/BudgetForm';
import { getBudgets, updateBudget, getMainCategories, getSubCategories } from '@/lib/actions'; // Added getSubCategories
import { notFound } from 'next/navigation';
import type { Budget, MainCategory, SubCategory } from '@/lib/definitions'; // Added MainCategory, SubCategory
import { getTranslations } from '@/lib/getTranslations';

async function getBudgetById(id: string): Promise<Budget | null> {
  const budgets = await getBudgets(); 
  const budget = budgets.find(b => b.id === id);
  return budget || null;
}

export default async function EditBudgetPage({ params }: { params: { id: string /*, locale: string*/ } }) {
  const { id } = params; // locale removed from params
  const locale = 'en'; // Hardcode locale
  const t = await getTranslations(locale);
  const tb = t.budgetsPage;

  const budget = await getBudgetById(id);
  const mainCategories = await getMainCategories();
  const subCategories = await getSubCategories(); // Fetch subCategories

  if (!budget) {
    notFound();
  }
  
  if (mainCategories.length === 0 || subCategories.length === 0) {
    // This check could be more granular or lead to a specific message page
    // For now, if essential data is missing, prevent rendering the form in a broken state.
    // Ideally, redirect or show a message prompting to create categories.
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
        subCategories={subCategories} // Pass subCategories
        translations={tb}
        locale={locale}
      />
    </>
  );
}
