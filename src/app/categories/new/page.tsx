
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
import { Save, ArrowLeft, PlusCircle, Palette, Tag, Icon } from 'lucide-react';
import { useGlobalLoader } from '@/context/global-loader-context';
import { iconMapKeys, IconRenderer } from '@/components/common/icon-renderer';

// Schemas
const hexColorRegex = /^#([0-9A-Fa-f]{6})$/i; // Updated to require 6 hex characters

const MainCategorySchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  icon: z.string().nullable().optional(),
  color: z.string().regex(hexColorRegex, { message: "Invalid hex color (e.g., #RRGGBB)." }).nullable().optional(),
});
type MainCategoryFormData = z.infer<typeof MainCategorySchema>;

const SubCategorySchema = z.object({
  mainCategoryId: z.string().min(1, { message: "Parent category is required." }),
  name: z.string().min(1, { message: "Name is required." }),
  icon: z.string().nullable().optional(),
  color: z.string().regex(hexColorRegex, { message: "Invalid hex color (e.g., #RRGGBB)." }).nullable().optional(),
});
type SubCategoryFormData = z.infer<typeof SubCategorySchema>;


export default function CreateCategoryPage() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const { setIsLoading: setGlobalLoading } = useGlobalLoader();

  const [existingMainCategories, setExistingMainCategories] = useState<MainCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [activeTab, setActiveTab] = useState("main");

  const mainCategoryForm = useForm<MainCategoryFormData>({
    resolver: zodResolver(MainCategorySchema),
    defaultValues: { name: '', icon: null, color: '#FFFFFF' }, // Default color to white
  });

  const subCategoryForm = useForm<SubCategoryFormData>({
    resolver: zodResolver(SubCategorySchema),
    defaultValues: { mainCategoryId: '', name: '', icon: null, color: '#FFFFFF' }, // Default color to white
  });
  
  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoadingCategories(true);
      getMainCategories(token)
        .then(data => {
          setExistingMainCategories(Array.isArray(data) ? data : []); 
        })
        .catch(error => {
          console.error("Failed to fetch main categories for dropdown", error);
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
          setExistingMainCategories([]); 
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
    const payloadForBody: CreateSubCategoryPayload = {
      name: data.name,
      icon: data.icon || null,
      color: data.color || null,
      mainCategoryId: data.mainCategoryId, 
    };
    try {
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
                    <Label htmlFor="main-icon-select">{t('iconLabel')}</Label>
                    <Controller
                      name="icon"
                      control={mainCategoryForm.control}
                      render={({ field }) => (
                        <Select
                          onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                          value={field.value || 'none'}
                        >
                          <SelectTrigger id="main-icon-select">
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
                    {mainCategoryForm.formState.errors.icon && <p className="text-sm text-destructive">{mainCategoryForm.formState.errors.icon.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="main-color-picker">{t('colorLabel')}</Label>
                    <Controller
                        name="color"
                        control={mainCategoryForm.control}
                        render={({ field }) => (
                            <Input
                                type="color"
                                id="main-color-picker"
                                value={field.value || '#FFFFFF'}
                                onChange={field.onChange}
                                className="h-10 w-full rounded-md border p-1"
                            />
                        )}
                    />
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
                        <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={isLoadingCategories || !existingMainCategories || existingMainCategories.length === 0}
                        >
                          <SelectTrigger id="sub-mainCategoryId">
                            <SelectValue placeholder={
                                isLoadingCategories 
                                ? t('loading') 
                                : (!existingMainCategories || existingMainCategories.length === 0 
                                    ? t('noCategoriesFoundTitle') 
                                    : t('selectParentCategoryPlaceholder'))
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(existingMainCategories) && existingMainCategories.map(cat => (
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
                    <Label htmlFor="sub-icon-select">{t('iconLabel')}</Label>
                     <Controller
                      name="icon"
                      control={subCategoryForm.control}
                      render={({ field }) => (
                        <Select
                          onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                          value={field.value || 'none'}
                        >
                          <SelectTrigger id="sub-icon-select">
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
                    {subCategoryForm.formState.errors.icon && <p className="text-sm text-destructive">{subCategoryForm.formState.errors.icon.message}</p>}
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="sub-color-picker">{t('colorLabel')}</Label>
                    <Controller
                        name="color"
                        control={subCategoryForm.control}
                        render={({ field }) => (
                            <Input
                                type="color"
                                id="sub-color-picker"
                                value={field.value || '#FFFFFF'}
                                onChange={field.onChange}
                                className="h-10 w-full rounded-md border p-1"
                            />
                        )}
                    />
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
