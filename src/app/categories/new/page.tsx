
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { createMainCategory, createSubCategory, getMainCategories } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import type { MainCategory, CreateMainCategoryPayload, CreateSubCategoryPayload } from '@/types';
import { Save, ArrowLeft, PlusCircle, Palette, Tag } from 'lucide-react';
import { useGlobalLoader } from '@/context/global-loader-context';

// Schemas
const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/i;

const MainCategorySchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  icon: z.string().nullable().optional(),
  color: z.string().regex(hexColorRegex, { message: "Invalid hex color (e.g., #RRGGBB or #RGB)." }).nullable().optional(),
});
type MainCategoryFormData = z.infer<typeof MainCategorySchema>;

const SubCategorySchema = z.object({
  mainCategoryId: z.string().min(1, { message: "Parent category is required." }), // This is the ID of the main category
  name: z.string().min(1, { message: "Name is required." }),
  icon: z.string().nullable().optional(),
  color: z.string().regex(hexColorRegex, { message: "Invalid hex color (e.g., #RRGGBB or #RGB)." }).nullable().optional(),
});
type SubCategoryFormData = z.infer<typeof SubCategorySchema>;


export default function CreateCategoryPage() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const { setIsLoading: setGlobalLoading, isLoading: isGlobalLoadingOuter } = useGlobalLoader();

  const [existingMainCategories, setExistingMainCategories] = useState<MainCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [activeTab, setActiveTab] = useState("main");

  const mainCategoryForm = useForm<MainCategoryFormData>({
    resolver: zodResolver(MainCategorySchema),
    defaultValues: { name: '', icon: null, color: null },
  });

  const subCategoryForm = useForm<SubCategoryFormData>({
    resolver: zodResolver(SubCategorySchema),
    defaultValues: { mainCategoryId: '', name: '', icon: null, color: null },
  });
  
  const watchedMainColor = mainCategoryForm.watch('color');
  const watchedSubColor = subCategoryForm.watch('color');

  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoadingCategories(true);
      getMainCategories(token)
        .then(data => setExistingMainCategories(data || [])) // Ensure data is an array
        .catch(error => {
          console.error("Failed to fetch main categories for dropdown", error);
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
          setExistingMainCategories([]); // Set to empty array on error
        })
        .finally(() => setIsLoadingCategories(false));
    }
  }, [token, isAuthenticated, toast, t]);
  
  useEffect(() => {
    setGlobalLoading(mainCategoryForm.formState.isSubmitting || subCategoryForm.formState.isSubmitting || isLoadingCategories);
  }, [mainCategoryForm.formState.isSubmitting, subCategoryForm.formState.isSubmitting, isLoadingCategories, setGlobalLoading]);


  const onMainCategorySubmit: SubmitHandler<MainCategoryFormData> = async (data) => {
    if (!token) return;
    const payload: CreateMainCategoryPayload = {
      name: data.name,
      icon: data.icon || null,
      color: data.color || null,
    };
    try {
      await createMainCategory(payload, token);
      toast({ title: t('mainCategoryCreatedTitle'), description: t('mainCategoryCreatedDesc') });
      router.push('/categories');
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorCreatingMainCategory'), description: error.message });
    }
  };

  const onSubCategorySubmit: SubmitHandler<SubCategoryFormData> = async (data) => {
    if (!token) return;
    // The mainCategoryId from the form is the actual ID of the main category.
    // The API expects this ID in the URL, and the rest of the data in the body.
    // The CreateSubCategoryPayload should align with what the backend expects in the body.
    const payloadForBody: CreateSubCategoryPayload = {
      name: data.name,
      icon: data.icon || null,
      color: data.color || null,
      mainCategoryId: data.mainCategoryId, // Ensure this key matches what your backend expects in the body if needed
    };
    try {
      // Pass mainCategoryId to the API function which uses it in the URL
      // and payloadForBody for the request body
      await createSubCategory(data.mainCategoryId, payloadForBody, token);
      toast({ title: t('subCategoryCreatedTitle'), description: t('subCategoryCreatedDesc') });
      router.push('/categories');
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorCreatingSubCategory'), description: error.message });
    }
  };
  
  const isSubmitting = mainCategoryForm.formState.isSubmitting || subCategoryForm.formState.isSubmitting;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-3xl font-bold text-foreground">{t('createCategoryPageTitle')}</h1>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backButton')}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="main">{t('mainCategoryTab')}</TabsTrigger>
            <TabsTrigger value="sub">{t('subCategoryTab')}</TabsTrigger>
          </TabsList>

          <TabsContent value="main">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>{t('createMainCategoryTitle')}</CardTitle>
                <CardDescription>{t('createMainCategoryDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={mainCategoryForm.handleSubmit(onMainCategorySubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="main-name">{t('categoryNameLabel')}</Label>
                    <Input id="main-name" {...mainCategoryForm.register('name')} placeholder={t('categoryNamePlaceholder')} />
                    {mainCategoryForm.formState.errors.name && <p className="text-sm text-destructive">{mainCategoryForm.formState.errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="main-icon">{t('iconNameLabel')}</Label>
                    <Input id="main-icon" {...mainCategoryForm.register('icon')} placeholder={t('iconNamePlaceholder')} />
                    {mainCategoryForm.formState.errors.icon && <p className="text-sm text-destructive">{mainCategoryForm.formState.errors.icon.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="main-color">{t('colorHexLabel')}</Label>
                    <div className="flex items-center gap-2">
                        <Input id="main-color" {...mainCategoryForm.register('color')} placeholder="#RRGGBB" className="flex-grow"/>
                        {watchedMainColor && hexColorRegex.test(watchedMainColor) && (
                            <div style={{ backgroundColor: watchedMainColor }} className="w-8 h-8 rounded-md border flex-shrink-0" />
                        )}
                    </div>
                    {mainCategoryForm.formState.errors.color && <p className="text-sm text-destructive">{mainCategoryForm.formState.errors.color.message}</p>}
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? t('saving') : ( <> <PlusCircle className="mr-2 h-4 w-4" /> {t('createButton')} </> )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sub">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>{t('createSubCategoryTitle')}</CardTitle>
                <CardDescription>{t('createSubCategoryDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={subCategoryForm.handleSubmit(onSubCategorySubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="sub-mainCategoryId">{t('parentCategoryLabel')}</Label>
                    <Controller
                      name="mainCategoryId"
                      control={subCategoryForm.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingCategories || existingMainCategories.length === 0}>
                          <SelectTrigger id="sub-mainCategoryId">
                            <SelectValue placeholder={isLoadingCategories ? t('loading') : t('selectParentCategoryPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            {existingMainCategories.map(cat => (
                              <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {subCategoryForm.formState.errors.mainCategoryId && <p className="text-sm text-destructive">{subCategoryForm.formState.errors.mainCategoryId.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sub-name">{t('categoryNameLabel')}</Label>
                    <Input id="sub-name" {...subCategoryForm.register('name')} placeholder={t('categoryNamePlaceholder')} />
                    {subCategoryForm.formState.errors.name && <p className="text-sm text-destructive">{subCategoryForm.formState.errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sub-icon">{t('iconNameLabel')}</Label>
                    <Input id="sub-icon" {...subCategoryForm.register('icon')} placeholder={t('iconNamePlaceholder')} />
                    {subCategoryForm.formState.errors.icon && <p className="text-sm text-destructive">{subCategoryForm.formState.errors.icon.message}</p>}
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="sub-color">{t('colorHexLabel')}</Label>
                     <div className="flex items-center gap-2">
                        <Input id="sub-color" {...subCategoryForm.register('color')} placeholder="#RRGGBB" className="flex-grow"/>
                        {watchedSubColor && hexColorRegex.test(watchedSubColor) && (
                            <div style={{ backgroundColor: watchedSubColor }} className="w-8 h-8 rounded-md border flex-shrink-0" />
                        )}
                    </div>
                    {subCategoryForm.formState.errors.color && <p className="text-sm text-destructive">{subCategoryForm.formState.errors.color.message}</p>}
                  </div>
                  <Button type="submit" disabled={isSubmitting || isLoadingCategories} className="w-full">
                     {isSubmitting ? t('saving') : ( <> <Tag className="mr-2 h-4 w-4" /> {t('createButton')} </>)}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

