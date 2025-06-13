import { PageHeader } from '@/components/shared/PageHeader';
import { CategoryForm } from '../../../_components/CategoryForm';
import { getMainCategories, updateMainCategory } from '@/lib/actions';
import { notFound } from 'next/navigation';
import type { MainCategory } from '@/lib/definitions';

async function getMainCategoryById(id: string): Promise<MainCategory | null> {
  const categories = await getMainCategories();
  const category = categories.find(c => c.id === id);
  return category || null;
}

export default async function EditMainCategoryPage({ params }: { params: { id: string } }) {
  const category = await getMainCategoryById(params.id);

  if (!category) {
    notFound();
  }

  const handleSubmit = async (data: Omit<MainCategory, 'id' | 'userId'>) => {
    'use server';
    return updateMainCategory(params.id, data);
  };

  return (
    <>
      <PageHeader title="Edit Main Category" description={`Update details for ${category.name}.`} />
      <CategoryForm type="main" initialData={category} onSubmitAction={handleSubmit} />
    </>
  );
}
