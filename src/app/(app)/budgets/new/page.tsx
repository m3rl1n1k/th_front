
import { PageHeader } from '@/components/shared/PageHeader';
import { BudgetForm } from '../_components/BudgetForm';
import { createBudget, getMainCategories, getSubCategories } from '@/lib/actions';
import { getTranslations } from '@/lib/getTranslations';
import { cookies } from 'next/headers'; // Import cookies
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function NewBudgetPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const t = await getTranslations(locale);
  const tb = t.budgetsPage;
  const mainCategories = await getMainCategories();
  const subCategories = await getSubCategories();

  const handleSubmit = async (data: any) => {
    'use server';
    return createBudget(data);
  };

  if (mainCategories.length === 0 || subCategories.length === 0) {
    return (
       <>
        <PageHeader title={tb.newBudgetTitle} description={tb.newBudgetDescription} />
        <div className="max-w-2xl mx-auto p-6 border rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-semibold mb-2">Cannot Create Budget</h2>
          {mainCategories.length === 0 && <p className="text-muted-foreground">You need to add at least one main category first.</p>}
          {subCategories.length === 0 && <p className="text-muted-foreground mt-2">You need to add at least one sub-category first.</p>}
          <div className="mt-4 space-x-2">
            <Button asChild variant="outline"><Link href="/categories/new">Add Category</Link></Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader title={tb.newBudgetTitle} description={tb.newBudgetDescription} />
      <BudgetForm
        onSubmitAction={handleSubmit}
        mainCategories={mainCategories}
        subCategories={subCategories}
        translations={tb}
        locale={locale}
      />
    </>
  );
}
