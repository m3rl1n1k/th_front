
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, getYear } from 'date-fns';

import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { createBudget, getMainCategories } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import type { CreateBudgetPayload, MainCategory as ApiMainCategory } from '@/types';
import { ArrowLeft, Save, Loader2, Shapes, CalendarDays, DollarSign } from 'lucide-react';

const generateCategoryTranslationKey = (name: string | undefined | null): string => {
  if (!name) return '';
  return name.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

const currentYear = getYear(new Date());
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i); // Current year +/- 2 years

const createBudgetFormSchema = (t: Function) => z.object({
  plannedAmount: z.coerce.number().positive({ message: t('amountPositiveError') }),
  year: z.string().min(4, { message: t('yearRequiredError') }),
  month: z.string().min(1, { message: t('monthRequiredError') }),
  categoryId: z.string().min(1, { message: t('categoryRequiredError') }),
});

type BudgetFormData = z.infer<ReturnType<typeof createBudgetFormSchema>>;

export default function NewBudgetPage() {
  const { token, isAuthenticated, user } = useAuth();
  const { t, dateFnsLocale } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();

  const [mainCategoriesHierarchical, setMainCategoriesHierarchical] = useState<ApiMainCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const BudgetFormSchema = createBudgetFormSchema(t);

  const { control, handleSubmit, formState: { errors, isSubmitting: formIsSubmitting }, register } = useForm<BudgetFormData>({
    resolver: zodResolver(BudgetFormSchema),
    defaultValues: {
      plannedAmount: undefined,
      year: String(currentYear),
      month: String(new Date().getMonth() + 1), // Default to current month (1-12)
      categoryId: '',
    },
  });

  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoadingCategories(true);
      getMainCategories(token)
        .then(data => setMainCategoriesHierarchical(Array.isArray(data) ? data : []))
        .catch(error => {
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
          setMainCategoriesHierarchical([]);
        })
        .finally(() => setIsLoadingCategories(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated, toast, t]);

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: format(new Date(currentYear, i), 'MMMM', { locale: dateFnsLocale }),
  }));

  const onSubmit: SubmitHandler<BudgetFormData> = async (data) => {
    if (!token || !user?.userCurrency?.code) {
      toast({ variant: "destructive", title: t('error'), description: t('userCurrencyNotSetError') });
      return;
    }

    const monthString = `${data.year}-${String(data.month).padStart(2, '0')}`;

    const payload: CreateBudgetPayload = {
      month: monthString,
      plannedAmount: Math.round(data.plannedAmount * 100), // Convert to cents
      currencyCode: user.userCurrency.code,
      category_id: parseInt(data.categoryId, 10),
    };

    try {
      await createBudget(payload, token);
      toast({ title: t('budgetCreatedTitle'), description: t('budgetCreatedDesc') });
      router.push('/budgets');
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorCreatingBudget'), description: error.message });
    }
  };

  const isButtonDisabled = formIsSubmitting || isLoadingCategories;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-3xl font-bold text-foreground">{t('newBudgetPageTitle')}</h1>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backButton')}
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('enterBudgetDetailsTitle')}</CardTitle>
            <CardDescription>{t('fillBudgetFormBelow')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="plannedAmount">{t('budgetFormPlannedAmount')}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="plannedAmount"
                      type="number"
                      step="0.01"
                      {...register('plannedAmount')}
                      placeholder={t('amountPlaceholder', { currency: user?.userCurrency?.code || '$' })}
                      className={`pl-10 ${errors.plannedAmount ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.plannedAmount && <p className="text-sm text-destructive">{errors.plannedAmount.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="categoryId">{t('budgetFormCategoryLabel')}</Label>
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingCategories || mainCategoriesHierarchical.length === 0}
                      >
                        <SelectTrigger id="categoryId" className={errors.categoryId ? 'border-destructive' : ''}>
                          <Shapes className="mr-2 h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder={isLoadingCategories ? t('loading') : t('selectCategoryPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent className="max-h-72 overflow-y-auto">
                          {mainCategoriesHierarchical.map(mainCat => (
                            <SelectGroup key={mainCat.id}>
                              <SelectLabel>{t(generateCategoryTranslationKey(mainCat.name), { defaultValue: mainCat.name })}</SelectLabel>
                              {mainCat.subCategories && mainCat.subCategories.map(subCat => (
                                <SelectItem key={subCat.id} value={String(subCat.id)}>
                                  {t(generateCategoryTranslationKey(subCat.name), { defaultValue: subCat.name })}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                  <Label htmlFor="year">{t('budgetFormYear')}</Label>
                  <Controller
                    name="year"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="year" className={errors.year ? 'border-destructive' : ''}>
                          <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder={t('budgetFormSelectYearPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map(yearVal => (
                            <SelectItem key={yearVal} value={String(yearVal)}>{yearVal}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="month">{t('budgetFormMonth')}</Label>
                  <Controller
                    name="month"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="month" className={errors.month ? 'border-destructive' : ''}>
                           <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder={t('budgetFormSelectMonthPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {months.map(monthObj => (
                            <SelectItem key={monthObj.value} value={monthObj.value}>{monthObj.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.month && <p className="text-sm text-destructive">{errors.month.message}</p>}
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isButtonDisabled}>
                  {isButtonDisabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isButtonDisabled ? t('saving') : t('createBudgetButton')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
