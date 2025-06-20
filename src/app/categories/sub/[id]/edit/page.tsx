
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { getMainCategories, updateSubCategory } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import type { MainCategory, SubCategory, UpdateSubCategoryPayload } from '@/types';
import { Save, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'; // Removed Check
import { iconMapKeys, IconRenderer } from '@/components/common/icon-renderer';
import { Skeleton } from '@/components/ui/skeleton';
import { ColorSwatches, predefinedColors } from '@/components/common/ColorSwatches'; // Import reusable component

const hexColorRegex = /^#([0-9A-Fa-f]{6})$/i;

const generateCategoryTranslationKey = (name: string | undefined | null): string => {
  if (!name) return '';
  return name.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

const createEditSubCategorySchema = (t: Function) => z.object({
  mainCategoryId: z.string().min(1, { message: t("parentCategoryRequiredError") }),
  name: z.string().min(1, { message: t("categoryNameRequiredError") }),
  icon: z.string().nullable().optional(),
  color: z.string().regex(hexColorRegex, { message: t("invalidHexColorError") }).nullable().optional(),
});
type EditSubCategoryFormData = z.infer<ReturnType<typeof createEditSubCategorySchema>>;

export default function EditSubCategoryPage() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string; // subCategoryId

  const [subCategoryToEdit, setSubCategoryToEdit] = useState<SubCategory | null>(null);
  const [allMainCategories, setAllMainCategories] = useState<MainCategory[]>([]);
  
  const [isLoadingData, setIsLoadingData] = useState(true); 
  const [formIsSubmitting, setFormIsSubmitting] = useState(false); 
  const [errorOccurred, setErrorOccurred] = useState(false);

  const EditSubCategorySchema = useMemo(() => createEditSubCategorySchema(t), [t]);

  const { control, handleSubmit, formState: { errors }, reset, register } = useForm<EditSubCategoryFormData>({
    resolver: zodResolver(EditSubCategorySchema),
    defaultValues: { mainCategoryId: '', name: '', icon: null, color: predefinedColors[0] },
  });

  const fetchInitialData = useCallback(async () => {
    if (!id || !token) {
      setIsLoadingData(false);
      setErrorOccurred(true);
      toast({ variant: "destructive", title: t('error'), description: t('tokenOrIdMissingError') });
      return;
    }
    setIsLoadingData(true);
    try {
      const fetchedMainCategories = await getMainCategories(token);
      setAllMainCategories(Array.isArray(fetchedMainCategories) ? fetchedMainCategories : []);

      let foundSubCategory: SubCategory | null = null;
      let foundParentId: string | null = null;

      for (const mainCat of fetchedMainCategories) {
        const sub = mainCat.subCategories.find(sc => String(sc.id) === String(id));
        if (sub) {
          foundSubCategory = sub;
          foundParentId = String(mainCat.id);
          break;
        }
      }

      if (foundSubCategory && foundParentId) {
        setSubCategoryToEdit(foundSubCategory);
        reset({
          mainCategoryId: foundParentId,
          name: foundSubCategory.name || '',
          icon: foundSubCategory.icon || null,
          color: foundSubCategory.color || predefinedColors[0],
        });
      } else {
        setErrorOccurred(true);
        toast({ variant: "destructive", title: t('errorFetchingCategory'), description: t('subCategoryNotFound') });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorFetchingCategory'), description: error.message });
      setErrorOccurred(true);
    } finally {
      setIsLoadingData(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, reset, toast, t]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated, fetchInitialData]);

  const onSubmit: SubmitHandler<EditSubCategoryFormData> = async (data) => {
    if (!token || !id) return;
    setFormIsSubmitting(true);
    const payload: UpdateSubCategoryPayload = {
      name: data.name,
      main_category: parseInt(data.mainCategoryId, 10),
      icon: data.icon || null,
      color: data.color || null,
    };
    try {
      await updateSubCategory(id, payload, token);
      toast({ title: t('subCategoryUpdatedTitle'), description: t('subCategoryUpdatedDesc') });
      router.push('/categories');
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorUpdatingSubCategory'), description: error.message });
    } finally {
      setFormIsSubmitting(false);
    }
  };
  
  if (isLoadingData) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-1/2" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Card className="shadow-lg">
            <CardHeader>
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-1/4 ml-auto" />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (errorOccurred || !subCategoryToEdit) {
    return (
      <MainLayout>
        <Card className="max-w-md mx-auto mt-10">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive"><AlertTriangle className="mr-2"/>{t('errorFetchingCategory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t('couldNotLoadCategoryEdit')}</p>
            <Button onClick={() => router.back()} variant="outline" className="mt-4 w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> {t('backButton')}
            </Button>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  let titleCategoryNameDisplay;
  if (isLoadingData) {
    titleCategoryNameDisplay = t('loading');
  } else if (subCategoryToEdit && subCategoryToEdit.name && subCategoryToEdit.name.trim() !== "") {
    titleCategoryNameDisplay = subCategoryToEdit.name;
  } else if (subCategoryToEdit) { 
    titleCategoryNameDisplay = t('unnamedCategoryPlaceholder');
  } else { 
    titleCategoryNameDisplay = t('subCategoryNotFound');
  }

  const isButtonDisabled = formIsSubmitting || isLoadingData;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-3xl font-bold text-foreground">
            {t('editSubCategoryPageTitle', { categoryName: titleCategoryNameDisplay })}
          </h1>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backButton')}
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('updateSubCategoryDetails')}</CardTitle>
            <CardDescription>{t('modifyCategoryFormBelow')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="mainCategoryId">{t('parentCategoryLabel')}</Label>
                <Controller
                  name="mainCategoryId"
                  control={control}
                  render={({ field }) => (
                    <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={allMainCategories.length === 0}
                    >
                      <SelectTrigger id="mainCategoryId" className={errors.mainCategoryId ? 'border-destructive' : ''}>
                        <SelectValue placeholder={t('selectParentCategoryPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {allMainCategories.map(cat => (
                          <SelectItem key={cat.id} value={String(cat.id)}>{t(generateCategoryTranslationKey(cat.name), { defaultValue: cat.name })}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.mainCategoryId && <p className="text-sm text-destructive">{t(errors.mainCategoryId.message)}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t('categoryNameLabel')}</Label>
                <Input id="name" {...register('name')} placeholder={t('categoryNamePlaceholder')} className={errors.name ? 'border-destructive' : ''} />
                {errors.name && <p className="text-sm text-destructive">{t(errors.name.message)}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon-select">{t('iconLabel')}</Label>
                <Controller
                  name="icon"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                      value={field.value || 'none'}
                    >
                      <SelectTrigger id="icon-select" className={errors.icon ? 'border-destructive' : ''}>
                        <SelectValue placeholder={t('selectIconPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        <SelectItem value="none">{t('noIconOption')}</SelectItem>
                        {iconMapKeys.map(iconKey => (
                          <SelectItem key={iconKey} value={iconKey}>
                            <div className="flex items-center gap-2">
                              <IconRenderer iconName={iconKey} className="h-4 w-4" />
                              {iconKey}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.icon && <p className="text-sm text-destructive">{t(errors.icon.message as any)}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="color-swatches">{t('colorLabel')}</Label>
                <Controller
                    name="color"
                    control={control}
                    render={({ field }) => (
                      <ColorSwatches value={field.value} onChange={field.onChange} />
                    )}
                />
                {errors.color && <p className="text-sm text-destructive">{t(errors.color.message)}</p>}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isButtonDisabled}>
                  {isButtonDisabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isButtonDisabled ? t('saving') : t('updateSubCategoryButton')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
