
"use client";

import React, { useEffect, useState, useCallback } from 'react';
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
import { Save, ArrowLeft, Loader2, AlertTriangle, Check } from 'lucide-react';
import { iconMapKeys, IconRenderer } from '@/components/common/icon-renderer';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const predefinedColors = [
  // Soft neutrals & grays
  '#F3F4F6', // Tailwind gray-100 (Light Gray)
  '#D1D5DB', // Tailwind gray-300 (Medium Gray)
  '#6B7280', // Tailwind gray-500 (Darker Gray)
  '#374151', // Tailwind gray-700 (Very Dark Gray)

  // Muted Reds/Pinks
  '#FECACA', // Tailwind red-200 (Light Red/Pink)
  '#F87171', // Tailwind red-400 (Soft Red)
  '#FCA5A5', // Tailwind red-300 (Salmon Pink)
  
  // Muted Oranges/Yellows
  '#FDE68A', // Tailwind yellow-200 (Pale Yellow)
  '#FBBF24', // Tailwind amber-400 (Soft Orange)
  '#FCD34D', // Tailwind amber-300 (Light Orange)

  // Muted Greens
  '#A7F3D0', // Tailwind emerald-200 (Light Mint Green)
  '#34D399', // Tailwind emerald-400 (Soft Green)
  '#6EE7B7', // Tailwind emerald-300 (Mint Green)

  // Muted Blues
  '#BFDBFE', // Tailwind blue-200 (Light Blue)
  '#60A5FA', // Tailwind blue-400 (Soft Blue)
  '#93C5FD', // Tailwind blue-300 (Sky Blue)

  // Muted Purples/Indigos
  '#C4B5FD', // Tailwind indigo-300 (Light Lavender)
  '#A78BFA', // Tailwind violet-400 (Soft Purple)
  '#DDD6FE', // Tailwind violet-200 (Very Light Purple)

  // Other muted tones
  '#FBCFE8', // Tailwind pink-200 (Light Pink)
  '#A5B4FC', // Tailwind indigo-400 (Muted Indigo)
  '#7DD3FC', // Tailwind sky-300 (Soft Sky Blue)
];
const hexColorRegex = /^#([0-9A-Fa-f]{6})$/i;

const generateCategoryTranslationKey = (name: string | undefined | null): string => {
  if (!name) return '';
  return name.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

const EditSubCategorySchema = z.object({
  mainCategoryId: z.string().min(1, { message: "Parent category is required." }),
  name: z.string().min(1, { message: "Name is required." }),
  icon: z.string().nullable().optional(),
  color: z.string().regex(hexColorRegex, { message: "Invalid hex color (e.g., #RRGGBB)." }).nullable().optional(),
});
type EditSubCategoryFormData = z.infer<typeof EditSubCategorySchema>;

export default function EditSubCategoryPage() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string; // subCategoryId

  const [subCategoryToEdit, setSubCategoryToEdit] = useState<SubCategory | null>(null);
  const [allMainCategories, setAllMainCategories] = useState<MainCategory[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorOccurred, setErrorOccurred] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset, register } = useForm<EditSubCategoryFormData>({
    resolver: zodResolver(EditSubCategorySchema),
    defaultValues: { mainCategoryId: '', name: '', icon: null, color: predefinedColors[0] },
  });

  const fetchInitialData = useCallback(async () => {
    if (!id || !token) {
      setIsLoading(false);
      setErrorOccurred(true);
      toast({ variant: "destructive", title: t('error'), description: t('tokenOrIdMissingError') });
      return;
    }
    setIsLoading(true);
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
      setIsLoading(false);
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
    setIsSubmitting(true);
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
      setIsSubmitting(false);
    }
  };

  const ColorSwatches = ({ value, onChange }: { value: string | null | undefined, onChange: (color: string) => void }) => (
    <div className="grid grid-cols-7 gap-2 p-1 border rounded-md bg-muted/20 max-w-xs">
      {predefinedColors.map((color) => (
        <button
          type="button"
          key={color}
          onClick={() => onChange(color)}
          className={cn(
            "w-full aspect-square rounded-md border-2 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 flex items-center justify-center",
            value === color ? 'border-primary ring-2 ring-primary ring-offset-background' : 'border-transparent hover:border-muted-foreground/50',
            (color === '#FFFFFF' || color === '#F3F4F6') && 'border-input'
          )}
          style={{ backgroundColor: color }}
          title={color}
          aria-label={`Color ${color}`}
        >
          {value === color && <Check className={cn("h-3.5 w-3.5 text-primary-foreground mix-blend-difference")} />}
        </button>
      ))}
    </div>
  );
  
  if (isLoading) {
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
  if (isLoading) {
    titleCategoryNameDisplay = t('loading');
  } else if (subCategoryToEdit && subCategoryToEdit.name && subCategoryToEdit.name.trim() !== "") {
    titleCategoryNameDisplay = subCategoryToEdit.name;
  } else if (subCategoryToEdit) { 
    titleCategoryNameDisplay = t('unnamedCategoryPlaceholder');
  } else { 
    titleCategoryNameDisplay = t('subCategoryNotFound');
  }


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
                {errors.mainCategoryId && <p className="text-sm text-destructive">{errors.mainCategoryId.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t('categoryNameLabel')}</Label>
                <Input id="name" {...register('name')} placeholder={t('categoryNamePlaceholder')} className={errors.name ? 'border-destructive' : ''} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
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
                {errors.icon && <p className="text-sm text-destructive">{errors.icon.message}</p>}
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
                {errors.color && <p className="text-sm text-destructive">{errors.color.message}</p>}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmitting ? t('saving') : t('updateSubCategoryButton')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
