
import { PageHeader } from '@/components/shared/PageHeader';
import { BudgetForm } from '../../_components/BudgetForm';
import { getBudgets, updateBudget, getMainCategories } from '@/lib/actions';
import { notFound } from 'next/navigation';
import type { Budget } from '@/lib/definitions';
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

  if (!budget) {
    notFound();
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
        translations={tb}
        locale={locale}
      />
    </>
  );
}
