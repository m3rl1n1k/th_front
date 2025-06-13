import { PageHeader } from '@/components/shared/PageHeader';
import { CategoryForm } from '../../../_components/CategoryForm';
import { getSubCategories, getMainCategories, updateSubCategory } from '@/lib/actions';
import { notFound } from 'next/navigation';
import type { SubCategory, MainCategory } from '@/lib/definitions';

async function getSubCategoryById(id: string): Promise<SubCategory | null> {
  const categories = await getSubCategories(); // Assuming this gets all subcategories
  const category = categories.find(c => c.id === id);
  return category || null;
}

export default async function EditSubCategoryPage({ params }: { params: { id: string } }) {
  const category = await getSubCategoryById(params.id);
  const mainCategories = await getMainCategories();

  if (!category) {
    notFound();
  }

  const handleSubmit = async (data: Omit<SubCategory, 'id' | 'userId'>) => {
    'use server';
    return updateSubCategory(params.id, data);
  };

  return (
    <>
      <PageHeader title="Edit Sub-Category" description={`Update details for ${category.name}.`} />
      <CategoryForm type="sub" initialData={category} mainCategories={mainCategories} onSubmitAction={handleSubmit} />
    </>
  );
}
