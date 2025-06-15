
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link'; // Import Link
import { Button } from '@/components/ui/button'; // Import Button
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/context/auth-context';
import { getMainCategories } from '@/lib/api';
import type { MainCategory } from '@/types';
import { useTranslation } from '@/context/i18n-context';
import { useGlobalLoader } from '@/context/global-loader-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Shapes, PlusCircle } from 'lucide-react';
import { IconRenderer } from '@/components/common/icon-renderer';

export default function CategoriesPage() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { setIsLoading: setGlobalLoading } = useGlobalLoader();
  const [mainCategories, setMainCategories] = useState<MainCategory[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setGlobalLoading(isLoading);
  }, [isLoading, setGlobalLoading]);

  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoading(true);
      getMainCategories(token)
        .then(data => {
          setMainCategories(data || []);
        })
        .catch(error => {
          console.error("Failed to fetch main categories", error);
          setMainCategories([]); 
          // Toast for error can be added here
        })
        .finally(() => setIsLoading(false));
    } else if (!isAuthenticated) {
      setIsLoading(false);
      setMainCategories([]);
    }
  }, [token, isAuthenticated]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
           <div className="flex justify-between items-center">
            <h1 className="font-headline text-3xl font-bold text-foreground">{t('categoriesTitle')}</h1>
            <Button asChild variant="outline" disabled>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('addNewCategoryButton')}
            </Button>
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-1/2" />
                  <div className="pl-4 space-y-1">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-5 w-2/5" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!mainCategories || mainCategories.length === 0) {
    return (
      <MainLayout>
        <div className="space-y-6">
           <div className="flex justify-between items-center">
            <h1 className="font-headline text-3xl font-bold text-foreground">{t('categoriesTitle')}</h1>
            <Button asChild variant="default">
              <Link href="/categories/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('addNewCategoryButton')}
              </Link>
            </Button>
          </div>
          <Card className="text-center py-10">
            <CardHeader>
              <Shapes className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle>{t('noCategoriesFoundTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('noCategoriesFoundDescription')}</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="font-headline text-3xl font-bold text-foreground">{t('categoriesTitle')}</h1>
           <Button asChild variant="default">
              <Link href="/categories/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('addNewCategoryButton')}
              </Link>
            </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('mainCategoriesListTitle')}</CardTitle>
            <CardDescription>{t('mainCategoriesListDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {mainCategories.map((mainCat) => (
                <AccordionItem value={`main-${mainCat.id}`} key={mainCat.id}>
                  <AccordionTrigger className="hover:bg-muted/50 px-4 py-3 rounded-md transition-colors">
                    <div className="flex items-center space-x-3">
                      <IconRenderer iconName={mainCat.icon} className="text-primary" />
                      <span 
                        className="h-4 w-4 rounded-full border" 
                        style={{ backgroundColor: mainCat.color || 'hsl(var(--muted))' }}
                        title={mainCat.color || undefined}
                      ></span>
                      <span className="font-medium text-foreground">{mainCat.name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-3 pl-8 pr-2"> {/* Increased pl for sub-items */}
                    {mainCat.subCategories && mainCat.subCategories.length > 0 ? (
                      <ul className="space-y-2 mt-1">
                        {mainCat.subCategories.map((subCat) => (
                          <li key={subCat.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/30 transition-colors">
                            <IconRenderer iconName={subCat.icon} className="text-secondary-foreground h-4 w-4" /> {/* Smaller icon */}
                            <span 
                              className="h-3 w-3 rounded-full border" 
                              style={{ backgroundColor: subCat.color || 'hsl(var(--muted))' }}
                              title={subCat.color || undefined}
                            ></span>
                            <span className="text-sm text-muted-foreground">{subCat.name}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground px-2 py-1">{t('noSubcategories')}</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
