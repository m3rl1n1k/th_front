'use client';
import { PageHeader } from '@/components/shared/PageHeader';
import { CategoryForm } from '../_components/CategoryForm';
import { createMainCategory, createSubCategory, getMainCategories } from '@/lib/actions';
import type { MainCategory } from '@/lib/definitions';
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export default function NewCategoryPage() {
  const [mainCategories, setMainCategories] = useState<MainCategory[] | null>(null);
  const [activeTab, setActiveTab] = useState<'main' | 'sub'>('main');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMainCategories() {
      setLoading(true);
      try {
        const fetchedCategories = await getMainCategories();
        setMainCategories(fetchedCategories);
      } catch (error) {
        console.error("Failed to fetch main categories", error);
        setMainCategories([]); // Set to empty array on error to allow form rendering
      } finally {
        setLoading(false);
      }
    }
    fetchMainCategories();
  }, []);
  
  const handleMainSubmit = async (data: any) => {
    'use server'; // This indicates the function might be used in server context, but it is called from client
    return createMainCategory(data);
  };

  const handleSubSubmit = async (data: any) => {
    'use server';
    return createSubCategory(data);
  };

  return (
    <>
      <PageHeader title="Create New Category" description="Add a new main or sub-category to organize your finances." />
      
      <Tabs defaultValue="main" value={activeTab} onValueChange={(value) => setActiveTab(value as 'main' | 'sub')} className="w-full max-w-2xl mx-auto mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="main">Main Category</TabsTrigger>
          <TabsTrigger value="sub">Sub-Category</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="max-w-2xl mx-auto space-y-4 p-6 border rounded-lg shadow-lg">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-1/3 ml-auto" />
        </div>
      ) : (
        <>
          {activeTab === 'main' && (
            <CategoryForm type="main" onSubmitAction={handleMainSubmit} />
          )}
          {activeTab === 'sub' && mainCategories !== null && (
            <CategoryForm type="sub" mainCategories={mainCategories} onSubmitAction={handleSubSubmit} />
          )}
        </>
      )}
    </>
  );
}
