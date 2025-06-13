
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainCategoryList } from './_components/MainCategoryList';
import { SubCategoryList } from './_components/SubCategoryList';
import { getMainCategories, getSubCategories } from '@/lib/actions';

export default async function CategoriesPage() {
  const mainCategories = await getMainCategories();
  const subCategories = await getSubCategories(); 

  return (
    <>
      <PageHeader title="Categories" description="Organize your transactions by main and sub-categories.">
      </PageHeader>

      <Tabs defaultValue="main" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="main">Main Categories</TabsTrigger>
            <TabsTrigger value="sub">Sub-Categories</TabsTrigger>
          </TabsList>
           <Button asChild variant="outline">
              <Link href="/categories/new"> {/* Non-prefixed link */}
                <PlusCircle className="mr-2 h-4 w-4" /> Add Category
              </Link>
            </Button>
        </div>
        <TabsContent value="main">
          <MainCategoryList initialMainCategories={mainCategories} />
        </TabsContent>
        <TabsContent value="sub">
          <SubCategoryList initialSubCategories={subCategories} mainCategories={mainCategories} />
        </TabsContent>
      </Tabs>
    </>
  );
}
