
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller, SubmitHandler, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { getMainCategoryById, updateMainCategory } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import type { MainCategory, UpdateMainCategoryPayload } from '@/types';
import { Save, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'; // Removed Check
import { iconMapKeys, IconRenderer } from '@/components/common/icon-renderer';
import { Skeleton } from '@/components/ui/skeleton';
import { ColorSwatches, predefinedColors } from '@/components/common/ColorSwatches'; // Import reusable component

const hexColorRegex = /^#([0-9A-Fa-f]{6})$/i;

const createEditMainCategorySchema = (t: Function) => z.object({
  name: z.string().min(1, { message: t("categoryNameRequiredError") }),
  icon: z.string().nullable().optional(),
  color: z.string().regex(hexColorRegex, { message: t("invalidHexColorError") }).nullable().optional(),
});
type EditMainCategoryFormData = z.infer<ReturnType<typeof createEditMainCategorySchema>>;

export default function EditMainCategoryPage() {
  const { token, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [mainCategory, setMainCategory] = useState<MainCategory | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true); 
  const [formIsSubmitting, setFormIsSubmitting] = useState(false); 
  const [errorOccurred, setErrorOccurred] = useState(false);

  const EditMainCategorySchema = useMemo(() => createEditMainCategorySchema(t), [t]);

  const { control, handleSubmit, formState: { errors }, reset, register, watch } = useForm<EditMainCategoryFormData>({
    resolver: zodResolver(EditMainCategorySchema),
    defaultValues: { name: '', icon: null, color: predefinedColors[0] },
  });

  const watchedColor = watch('color'); // Keep watch for potential dynamic preview if needed elsewhere

  const fetchCategoryData = useCallback(async () => {
    if (!id || !token) {
      setIsLoadingData(false);
      setErrorOccurred(true);
      return;
    }
    setIsLoadingData(true);
    setErrorOccurred(false); 
    setMainCategory(null); 
    try {
      const categoryData = await getMainCategoryById(id, token);
      if (categoryData) {
        setMainCategory(categoryData);
        reset({
          name: categoryData.name || '', 
          icon: categoryData.icon || null,
          color: categoryData.color || predefinedColors[0],
        });
      } else {
        setErrorOccurred(true);
        toast({ variant: "destructive", title: t('errorFetchingCategory'), description: t('categoryNotFoundPlaceholder') });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorFetchingCategory'), description: error.message });
      setErrorOccurred(true);
    } finally {
      setIsLoadingData(false);
    }
  }, [id, token, reset, toast, t]);

  useEffect(() => {
    if (isAuthenticated && id && token) {
      fetchCategoryData();
    } else if (!authIsLoading && !isAuthenticated) {
      setIsLoadingData(false); 
      setErrorOccurred(true);
      toast({ variant: "destructive", title: t('error'), description: t('tokenOrIdMissingError') });
    }
  }, [isAuthenticated, authIsLoading, id, token, fetchCategoryData, t, toast]);


  const onSubmit: SubmitHandler<EditMainCategoryFormData> = async (data) => {
    if (!token || !id) return;
    setFormIsSubmitting(true);
    const payload: UpdateMainCategoryPayload = {
      name: data.name,
      icon: data.icon || null,
      color: data.color || null,
    };
    try {
      await updateMainCategory(id, payload, token);
      toast({ title: t('mainCategoryUpdatedTitle'), description: t('mainCategoryUpdatedDesc') });
      router.push('/categories');
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorUpdatingMainCategory'), description: error.message });
    } finally {
      setFormIsSubmitting(false);
    }
  };

  if (isLoadingData || authIsLoading) {
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
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-1/4 ml-auto" />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (errorOccurred || !mainCategory) { 
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
  } else if (mainCategory && mainCategory.name && mainCategory.name.trim() !== "") {
    titleCategoryNameDisplay = mainCategory.name;
  } else if (mainCategory) { 
    titleCategoryNameDisplay = t('unnamedCategoryPlaceholder');
  } else { 
    titleCategoryNameDisplay = t('categoryNotFoundPlaceholder');
  }


  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-3xl font-bold text-foreground">
            {t('editMainCategoryPageTitle', { categoryName: titleCategoryNameDisplay })}
          </h1>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backButton')}
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('updateMainCategoryDetails')}</CardTitle>
            <CardDescription>{t('modifyCategoryFormBelow')}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                <Button type="submit" disabled={formIsSubmitting || isLoadingData}>
                  {formIsSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {formIsSubmitting ? t('saving') : t('updateCategoryButton')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
