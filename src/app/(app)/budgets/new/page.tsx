
import { PageHeader } from '@/components/shared/PageHeader';
import { BudgetForm } from '../_components/BudgetForm';
import { createBudget, getMainCategories } from '@/lib/actions';
import { getTranslations } from '@/lib/getTranslations';

export default async function NewBudgetPage({ /*params: { locale }*/ }: { /*params: { locale: string }*/ }) {
  const locale = 'en'; // Hardcode locale
  const t = await getTranslations(locale);
  const tb = t.budgetsPage;
  const mainCategories = await getMainCategories();

  const handleSubmit = async (data: any) => {
    'use server';
    return createBudget(data);
  };

  return (
    <>
      <PageHeader title={tb.newBudgetTitle} description={tb.newBudgetDescription} />
      <BudgetForm
        onSubmitAction={handleSubmit}
        mainCategories={mainCategories}
        translations={tb}
        locale={locale}
      />
    </>
  );
}
