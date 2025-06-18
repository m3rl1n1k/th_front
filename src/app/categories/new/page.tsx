
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
import { useAuth } from '@/context/auth-context';
import { createMainCategory, createSubCategory, getMainCategories } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import type { MainCategory, CreateMainCategoryPayload, CreateSubCategoryPayload } from '@/types';
import { Save, ArrowLeft, PlusCircle, Tag, Check, Loader2 } from 'lucide-react';
import { iconMapKeys, IconRenderer } from '@/components/common/icon-renderer';
import { cn } from '@/lib/utils';

// Updated predefined color palette for a softer, less contrasted look
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


// Schemas
const hexColorRegex = /^#([0-9A-Fa-f]{6})$/i;

const createMainCategorySchema = () => z.object({
  name: z.string().min(1, { message: "categoryNameRequiredError" }),
  icon: z.string().nullable().optional(),
  color: z.string().regex(hexColorRegex, { message: "invalidHexColorError" }).nullable().optional(),
});
type MainCategoryFormData = z.infer<ReturnType<typeof createMainCategorySchema>>;

const createSubCategorySchema = () => z.object({
  mainCategoryId: z.string().min(1, { message: "parentCategoryRequiredError" }),
  name: z.string().min(1, { message: "categoryNameRequiredError" }),
  icon: z.string().nullable().optional(),
  color: z.string().regex(hexColorRegex, { message: "invalidHexColorError" }).nullable().optional(),
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

  const MainCategorySchema = useMemo(() => createMainCategorySchema(), []);
  const SubCategorySchema = useMemo(() => createSubCategorySchema(), []);


  const mainCategoryForm = useForm<MainCategoryFormData>({
    resolver: zodResolver(MainCategorySchema),
    defaultValues: { name: '', icon: null, color: predefinedColors[0] },
  });

  const subCategoryForm = useForm<SubCategoryFormData>({
    resolver: zodResolver(SubCategorySchema),
    defaultValues: { mainCategoryId: '', name: '', icon: null, color: predefinedColors[0] },
  });
  
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
            (color === '#FFFFFF' || color === '#F3F4F6') && 'border-input' // Add border for very light swatches for visibility
          )}
          style={{ backgroundColor: color }}
          title={color}
          aria-label={`Color ${color}`}
        >
          {value === color && <Check className={cn("h-3.5 w-3.5", (color === '#FFFFFF' || color === '#F3F4F6') ? 'text-gray-700' : 'text-primary-foreground mix-blend-difference')} />}
        </button>
      ))}
    </div>
  );

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
                    {mainCategoryForm.formState.errors.name && <p className="text-sm text-destructive">{t(mainCategoryForm.formState.errors.name.message)}</p>}
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
                    {mainCategoryForm.formState.errors.icon && <p className="text-sm text-destructive">{t(mainCategoryForm.formState.errors.icon.message)}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="main-color-swatches">{t('colorLabel')}</Label>
                    <Controller
                        name="color"
                        control={mainCategoryForm.control}
                        render={({ field }) => (
                          <ColorSwatches value={field.value} onChange={field.onChange} />
                        )}
                    />
                    {mainCategoryForm.formState.errors.color && <p className="text-sm text-destructive">{t(mainCategoryForm.formState.errors.color.message)}</p>}
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
                    {subCategoryForm.formState.errors.mainCategoryId && <p className="text-sm text-destructive">{t(subCategoryForm.formState.errors.mainCategoryId.message)}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sub-name">{t('categoryNameLabel')}</Label>
                    <Input id="sub-name" {...subCategoryForm.register('name')} placeholder={t('categoryNamePlaceholder')} />
                    {subCategoryForm.formState.errors.name && <p className="text-sm text-destructive">{t(subCategoryForm.formState.errors.name.message)}</p>}
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
                    {subCategoryForm.formState.errors.icon && <p className="text-sm text-destructive">{t(subCategoryForm.formState.errors.icon.message)}</p>}
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="sub-color-swatches">{t('colorLabel')}</Label>
                     <Controller
                        name="color"
                        control={subCategoryForm.control}
                        render={({ field }) => (
                          <ColorSwatches value={field.value} onChange={field.onChange} />
                        )}
                    />
                    {subCategoryForm.formState.errors.color && <p className="text-sm text-destructive">{t(subCategoryForm.formState.errors.color.message)}</p>}
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
