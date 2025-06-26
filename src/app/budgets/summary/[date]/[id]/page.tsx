
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parse } from 'date-fns';

import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { getBudgetSummaryItemForEdit, updateBudget, getMainCategories } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import type { BudgetDetails, UpdateBudgetPayload, MainCategory as ApiMainCategory, ApiError } from '@/types';
import { Save, ArrowLeft, Loader2, Shapes, CalendarDays, DollarSign, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CategorySelector } from '@/components/common/category-selector';

const generateCategoryTranslationKey = (name: string | undefined | null): string => {
  if (!name) return '';
  return name.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

const editBudgetFormSchema = (t: Function) => z.object({
  plannedAmount: z.coerce.number().positive({ message: t('amountPositiveError') }),
  categoryId: z.string().min(1, { message: t('categoryRequiredError') }),
});

type BudgetEditFormData = z.infer<ReturnType<typeof editBudgetFormSchema>>;

export default function EditBudgetItemPage() {
  const { token, isAuthenticated } = useAuth();
  const { t, dateFnsLocale } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const budgetId = params?.id as string;
  const monthYear = params?.date as string;

  const [budgetToEdit, setBudgetToEdit] = useState<BudgetDetails | null>(null);
  const [mainCategoriesHierarchical, setMainCategoriesHierarchical] = useState<ApiMainCategory[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [formIsSubmitting, setFormIsSubmitting] = useState(false);
  const [errorOccurred, setErrorOccurred] = useState(false);

  const BudgetFormSchema = editBudgetFormSchema(t);

  const { control, handleSubmit, formState: { errors }, reset, setValue } = useForm<BudgetEditFormData>({
    resolver: zodResolver(BudgetFormSchema),
    defaultValues: {
      plannedAmount: undefined,
      categoryId: '',
    },
  });

  const fetchBudgetData = useCallback(async () => {
    if (!budgetId || !monthYear || !token) {
      setIsLoadingData(false);
      setErrorOccurred(true);
      return;
    }
    setIsLoadingData(true);
    setErrorOccurred(false);
    try {
      const categoriesData = await getMainCategories(token);
      setMainCategoriesHierarchical(Array.isArray(categoriesData) ? categoriesData : []);
      
      if (monthYear && budgetId) {
        const fetchedBudgetItem = await getBudgetSummaryItemForEdit(monthYear, budgetId, token);
        setBudgetToEdit(fetchedBudgetItem);
        reset({
          plannedAmount: fetchedBudgetItem.plannedAmount, 
          categoryId: String(fetchedBudgetItem.subCategory?.id || ''),
        });
      }
    } catch (error: any) {
      if ((error as ApiError).code !== 401) {
        toast({ variant: "destructive", title: t('errorFetchingBudgetItem'), description: error.message });
      }
      setErrorOccurred(true);
    } finally {
      setIsLoadingData(false);
    }
  }, [budgetId, monthYear, token, reset, toast, t]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBudgetData();
    }
  }, [isAuthenticated, fetchBudgetData]);

  const onSubmit: SubmitHandler<BudgetEditFormData> = async (data) => {
    if (!token || !budgetId || !monthYear) {
      toast({ variant: "destructive", title: t('error'), description: t('genericError') });
      return;
    }

    const payload: UpdateBudgetPayload = {
      plannedAmount: Math.round(data.plannedAmount * 100),
      category_id: parseInt(data.categoryId, 10),
    };

    setFormIsSubmitting(true);
    try {
      // The path for updateBudget was previously changed in API_DOC and api.ts to /budgets/summary/{date}/{id}
      // This call reflects that change.
      await updateBudget(monthYear, budgetId, payload, token); 
      toast({ title: t('budgetItemUpdatedTitle'), description: t('budgetItemUpdatedDesc', {categoryName: budgetToEdit?.subCategory?.name || t('category')}) });
      router.push(`/budgets/summary/${monthYear}`); // Navigate back to the summary page for that month
    } catch (error: any) {
      if ((error as ApiError).code !== 401) {
        const apiError = error as ApiError;
        let errorMessage = apiError.message || t('unexpectedError');

        // Check for specific "Validation failed" message string
        if (typeof apiError.message === 'string' && apiError.message.toLowerCase().includes("validation failed")) {
            errorMessage = t('validationFailedCheckFields'); 
        } 
        // Check for the { "field": ["message"] } structure
        else if (Array.isArray(apiError.errors) && apiError.errors.length > 0 && apiError.errors[0].message) {
            errorMessage = apiError.errors.map(e => e.message).join('; ');
        } 
        // Check for the general {"errors": {"field": ["message"]}} structure
        else if (typeof apiError.errors === 'object' && apiError.errors !== null && !Array.isArray(apiError.errors)) {
            errorMessage = Object.values(apiError.errors).flat().join('; ');
        }
        toast({ variant: "destructive", title: t('errorUpdatingBudgetItem'), description: errorMessage });
      }
    } finally {
      setFormIsSubmitting(false);
    }
  };

  const formattedMonthDisplay = useMemo(() => {
    if (!monthYear) return '';
    try {
      return format(parse(monthYear, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: dateFnsLocale });
    } catch {
      return monthYear;
    }
  }, [monthYear, dateFnsLocale]);

  if (isLoadingData) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (errorOccurred || !budgetToEdit) { 
    return (
      <MainLayout>
        <Card className="max-w-2xl mx-auto shadow-lg border-destructive">
          <CardHeader className="bg-destructive/10">
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" />
              {t('errorFetchingBudgetItem')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p>{t('couldNotLoadBudgetItemEdit')}</p>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backButton')}
            </Button>
          </CardFooter>
        </Card>
      </MainLayout>
    );
  }
  const isButtonDisabled = formIsSubmitting || isLoadingData;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-3xl font-bold text-foreground">
            {t('editBudgetItemTitle', { categoryName: budgetToEdit?.subCategory?.name || t('category'), month: formattedMonthDisplay})}
          </h1>
          <Button variant="outline" onClick={() => router.push(`/budgets/summary/${monthYear}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backButton')}
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('updateBudgetDetailsTitle')}</CardTitle>
            <CardDescription>
                {t('updateBudgetDetailsDesc', { month: formattedMonthDisplay, currency: budgetToEdit?.currencyCode || 'N/A' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label htmlFor="monthDisplay">{t('budgetFormMonth')}</Label>
                  <Input id="monthDisplay" value={formattedMonthDisplay} disabled className="bg-muted/50"/>
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="currencyDisplay">{t('currencyLabel')}</Label>
                  <Input id="currencyDisplay" value={budgetToEdit?.currencyCode || 'N/A'} disabled  className="bg-muted/50"/>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label htmlFor="plannedAmount">{t('budgetFormPlannedAmount')}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="plannedAmount"
                      type="number"
                      step="0.01"
                      {...control.register('plannedAmount')}
                      placeholder={t('amountPlaceholder', { currency: budgetToEdit?.currencyCode || '$' })}
                      className={`pl-10 ${errors.plannedAmount ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.plannedAmount && <p className="text-sm text-destructive">{errors.plannedAmount.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="categoryId">{t('budgetFormCategoryLabel')}</Label>
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <CategorySelector
                          value={field.value}
                          onChange={field.onChange}
                          mainCategories={mainCategoriesHierarchical}
                          disabled={isLoadingData || mainCategoriesHierarchical.length === 0}
                          placeholder={t('selectCategoryPlaceholder')}
                          triggerClassName={errors.categoryId ? 'border-destructive' : ''}
                      />
                    )}
                  />
                  {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isButtonDisabled}>
                  {isButtonDisabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isButtonDisabled ? t('saving') : t('saveChangesButton')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
