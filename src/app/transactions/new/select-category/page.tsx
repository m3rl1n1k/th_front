"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/i18n-context';
import { getMainCategories } from '@/lib/api';
import type { MainCategory, ApiError } from '@/types';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Shapes } from 'lucide-react';
import { IconRenderer } from '@/components/common/icon-renderer';

const generateCategoryTranslationKey = (name: string | undefined | null): string => {
  if (!name) return '';
  return name.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

export default function SelectCategoryForTransactionPage() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(() => {
    if (isAuthenticated && token) {
      setIsLoading(true);
      getMainCategories(token)
        .then(data => {
          setMainCategories(Array.isArray(data) ? data : []);
        })
        .catch((error: ApiError) => {
          setMainCategories([]);
        })
        .finally(() => setIsLoading(false));
    } else if (!isAuthenticated) {
      setIsLoading(false);
      setMainCategories([]);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-3xl font-bold text-foreground">
            {t('selectCategoryForTransactionTitle')}
          </h1>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backButton')}
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('selectCategoryStepTitle')}</CardTitle>
            <CardDescription>{t('selectCategoryStepDesc')}</CardDescription>
          </CardHeader>
        </Card>

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : mainCategories.length === 0 ? (
          <Card className="text-center py-10">
            <CardHeader>
              <Shapes className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle>{t('noCategoriesFoundTitle')}</CardTitle>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-6">
            {mainCategories.map(mainCat => (
              <Card key={mainCat.id}>
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <IconRenderer iconName={mainCat.icon} className="mr-3 h-6 w-6" color={mainCat.color || 'hsl(var(--primary))'} />
                    {t(generateCategoryTranslationKey(mainCat.name), { defaultValue: mainCat.name })}
                  </CardTitle>
                </CardHeader>
                <div className="p-4 pt-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {mainCat.subCategories.map(subCat => (
                    <Button
                      key={subCat.id}
                      variant="outline"
                      asChild
                      className="h-auto py-3 flex-col gap-2 justify-center"
                    >
                      <Link href={`/transactions/new?categoryId=${subCat.id}`}>
                        <IconRenderer iconName={subCat.icon} className="h-6 w-6" color={subCat.color || 'hsl(var(--foreground))'} />
                        <span className="text-center text-xs sm:text-sm">
                          {t(generateCategoryTranslationKey(subCat.name), { defaultValue: subCat.name })}
                        </span>
                      </Link>
                    </Button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
