
"use client";

import React, { useEffect, useState, useMemo } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/context/auth-context';
import { createMainCategory, createSubCategory, getMainCategories } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import type { MainCategory, CreateMainCategoryPayload, CreateSubCategoryPayload } from '@/types';
import { Save, ArrowLeft, PlusCircle, Tag, Loader2, Palette } from 'lucide-react';
import { iconMapKeys, IconRenderer } from '@/components/common/icon-renderer';
import { ColorSwatches, predefinedColors } from '@/components/common/ColorSwatches';

const hexColorRegex = /^#([0-9A-Fa-f]{6})$/i;

const createMainCategorySchema = (t: Function) => z.object({
  name: z.string().min(1, { message: t("categoryNameRequiredError") }),
  icon: z.string().nullable().optional(),
  color: z.string().regex(hexColorRegex, { message: t("invalidHexColorError") }).nullable().optional(),
});
type MainCategoryFormData = z.infer<ReturnType<typeof createMainCategorySchema>>;

const createSubCategorySchema = (t: Function) => z.object({
  mainCategoryId: z.string().min(1, { message: t("parentCategoryRequiredError") }),
  name: z.string().min(1, { message: t("categoryNameRequiredError") }),
  icon: z.string().nullable().optional(),
  color: z.string().regex(hexColorRegex, { message: t("invalidHexColorError") }).nullable().optional(),
});
type SubCategoryFormData = z.infer<ReturnType<typeof createSubCategorySchema>>;


export default function CreateCategoryPage() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();

  const [existingMainCategories, setExistingMainCategories] = useState<MainCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [activeTab, setActiveTab] = useState("main");

  const [isMainColorModalOpen, setIsMainColorModalOpen] = useState(false);
  const [isSubColorModalOpen, setIsSubColorModalOpen] = useState(false);

  const MainCategorySchema = useMemo(() => createMainCategorySchema(t), [t]);
  const SubCategorySchema = useMemo(() => createSubCategorySchema(t), [t]);

  const mainCategoryForm = useForm<MainCategoryFormData>({
    resolver: zodResolver(MainCategorySchema),
    defaultValues: { name: '', icon: null, color: predefinedColors[0] },
  });

  const subCategoryForm = useForm<SubCategoryFormData>({
    resolver: zodResolver(SubCategorySchema),
    defaultValues: { mainCategoryId: '', name: '', icon: null, color: predefinedColors[0] },
  });
  
  const watchedMainColor = mainCategoryForm.watch('color');
  const watchedSubColor = subCategoryForm.watch('color');

  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoadingCategories(true);
      getMainCategories(token)
        .then(data => {
          setExistingMainCategories(Array.isArray(data) ? data : []); 
        })
        .catch(error => {
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
          setExistingMainCategories([]); 
        })
        .finally(() => setIsLoadingCategories(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated, toast, t]);
  

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
    const payload: CreateSubCategoryPayload = {
      name: data.name,
      main_category: parseInt(data.mainCategoryId, 10),
      icon: data.icon || null,
      color: data.color || null,
    };
    try {
      await createSubCategory(payload, token);
      toast({ title: t('subCategoryCreatedTitle'), description: t('subCategoryCreatedDesc') });
      router.push('/categories');
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorCreatingSubCategory'), description: error.message });
    }
  };
  
  const isMainFormSubmitting = mainCategoryForm.formState.isSubmitting;
  const isSubFormSubmitting = subCategoryForm.formState.isSubmitting;
  const isFormsLoading = isMainFormSubmitting || isSubFormSubmitting || isLoadingCategories;

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
              <CardContent className="pt-6">
                <form onSubmit={mainCategoryForm.handleSubmit(onMainCategorySubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="main-name">{t('categoryNameLabel')}</Label>
                    <Input id="main-name" {...mainCategoryForm.register('name')} placeholder={t('categoryNamePlaceholder')} />
                    {mainCategoryForm.formState.errors.name && <p className="text-sm text-destructive">{t(mainCategoryForm.formState.errors.name.message as any)}</p>}
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
                    {mainCategoryForm.formState.errors.icon && <p className="text-sm text-destructive">{t(mainCategoryForm.formState.errors.icon.message as any)}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="main-color-input">{t('colorLabel')}</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: watchedMainColor || 'transparent' }} />
                      <Controller
                        name="color"
                        control={mainCategoryForm.control}
                        render={({ field }) => (
                          <Input
                            id="main-color-input"
                            value={field.value || ''}
                            onChange={field.onChange}
                            readOnly
                            className="flex-grow"
                            placeholder="#RRGGBB"
                          />
                        )}
                      />
                      <Dialog open={isMainColorModalOpen} onOpenChange={setIsMainColorModalOpen}>
                        <DialogTrigger asChild>
                           <Button type="button" variant="outline"><Palette className="mr-2 h-4 w-4" /> {t('selectColorButton') || "Select"}</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>{t('selectCategoryColorTitle') || "Select Category Color"}</DialogTitle></DialogHeader>
                          <Controller
                            name="color"
                            control={mainCategoryForm.control}
                            render={({ field }) => (
                              <ColorSwatches 
                                value={field.value} 
                                onChange={(color) => { field.onChange(color); setIsMainColorModalOpen(false); }} 
                              />
                            )}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    {mainCategoryForm.formState.errors.color && <p className="text-sm text-destructive">{t(mainCategoryForm.formState.errors.color.message as any)}</p>}
                  </div>
                  <Button type="submit" disabled={isFormsLoading} className="w-full">
                    {isMainFormSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    {isMainFormSubmitting ? t('saving') : t('createButton')}
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
              <CardContent className="pt-6">
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
                    {subCategoryForm.formState.errors.mainCategoryId && <p className="text-sm text-destructive">{t(subCategoryForm.formState.errors.mainCategoryId.message as any)}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sub-name">{t('categoryNameLabel')}</Label>
                    <Input id="sub-name" {...subCategoryForm.register('name')} placeholder={t('categoryNamePlaceholder')} />
                    {subCategoryForm.formState.errors.name && <p className="text-sm text-destructive">{t(subCategoryForm.formState.errors.name.message as any)}</p>}
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
                    {subCategoryForm.formState.errors.icon && <p className="text-sm text-destructive">{t(subCategoryForm.formState.errors.icon.message as any)}</p>}
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="sub-color-input">{t('colorLabel')}</Label>
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: watchedSubColor || 'transparent' }} />
                        <Controller
                            name="color"
                            control={subCategoryForm.control}
                            render={({ field }) => (
                            <Input
                                id="sub-color-input"
                                value={field.value || ''}
                                onChange={field.onChange}
                                readOnly
                                className="flex-grow"
                                placeholder="#RRGGBB"
                            />
                            )}
                        />
                        <Dialog open={isSubColorModalOpen} onOpenChange={setIsSubColorModalOpen}>
                            <DialogTrigger asChild>
                                <Button type="button" variant="outline"><Palette className="mr-2 h-4 w-4" /> {t('selectColorButton') || "Select"}</Button>
                            </DialogTrigger>
                            <DialogContent>
                            <DialogHeader><DialogTitle>{t('selectCategoryColorTitle') || "Select Category Color"}</DialogTitle></DialogHeader>
                            <Controller
                                name="color"
                                control={subCategoryForm.control}
                                render={({ field }) => (
                                <ColorSwatches 
                                    value={field.value} 
                                    onChange={(color) => { field.onChange(color); setIsSubColorModalOpen(false); }} 
                                />
                                )}
                            />
                            </DialogContent>
                        </Dialog>
                    </div>
                    {subCategoryForm.formState.errors.color && <p className="text-sm text-destructive">{t(subCategoryForm.formState.errors.color.message as any)}</p>}
                  </div>
                  <Button type="submit" disabled={isFormsLoading} className="w-full">
                     {isSubFormSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Tag className="mr-2 h-4 w-4" />}
                     {isSubFormSubmitting ? t('saving') : t('createButton')}
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
