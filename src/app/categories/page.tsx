
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/context/auth-context';
import { getMainCategories } from '@/lib/api';
import type { MainCategory } from '@/types';
import { useTranslation } from '@/context/i18n-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Shapes, PlusCircle, Folder } from 'lucide-react';
import { IconRenderer } from '@/components/common/icon-renderer';

export default function CategoriesPage() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [mainCategories, setMainCategories] = useState<MainCategory[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoading(true);
      getMainCategories(token)
        .then(data => {
          setMainCategories(Array.isArray(data) ? data : []);
        })
        .catch(error => {
          console.error("Failed to fetch main categories", error);
          setMainCategories([]); 
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
                <Link href="/categories/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('addNewCategoryButton')}
                </Link>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex shadow-inner bg-muted/60 dark:bg-muted/30 p-1.5 rounded-lg">
            <TabsTrigger value="all" className="flex-1 gap-2 data-[state=active]:shadow-md data-[state=active]:bg-background dark:data-[state=active]:bg-muted/50 transition-all duration-150 py-2.5">
              <Shapes className="h-5 w-5" />
              {t('allCategoriesTab')}
            </TabsTrigger>
            <TabsTrigger value="main_only" className="flex-1 gap-2 data-[state=active]:shadow-md data-[state=active]:bg-background dark:data-[state=active]:bg-muted/50 transition-all duration-150 py-2.5">
              <Folder className="h-5 w-5" />
              {t('mainCategoriesOnlyTab')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>{t('mainCategoriesListTitle')}</CardTitle>
                <CardDescription>{t('mainCategoriesListDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {mainCategories.map((mainCat) => (
                    <AccordionItem value={`main-${mainCat.id}`} key={`all-${mainCat.id}`}>
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
                      <AccordionContent className="pt-2 pb-3 pl-8 pr-2">
                        {mainCat.subCategories && mainCat.subCategories.length > 0 ? (
                          <ul className="space-y-2 mt-1">
                            {mainCat.subCategories.map((subCat) => (
                              <li key={subCat.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/30 transition-colors">
                                <IconRenderer iconName={subCat.icon} className="text-secondary-foreground h-4 w-4" />
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
          </TabsContent>

          <TabsContent value="main_only" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>{t('mainCategoriesOnlyListTitle')}</CardTitle>
                <CardDescription>{t('mainCategoriesOnlyListDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {mainCategories.map(mainCat => (
                  <div key={`main-only-${mainCat.id}`} className="flex items-center space-x-3 p-3 border-b last:border-b-0 hover:bg-muted/50 rounded-md transition-colors">
                    <IconRenderer iconName={mainCat.icon} className="text-primary" />
                    <span 
                      className="h-4 w-4 rounded-full border" 
                      style={{ backgroundColor: mainCat.color || 'hsl(var(--muted))' }}
                      title={mainCat.color || undefined}
                    ></span>
                    <span className="font-medium text-foreground">{mainCat.name}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
