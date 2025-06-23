
"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTranslation } from '@/context/i18n-context';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Save, Palette, ListChecks, Loader2, LayoutDashboard } from 'lucide-react';
import { updateUserSettings, getUserSettings } from '@/lib/api';
import type { UserSettings, ApiError } from '@/types';
import { ColorSwatches } from '@/components/common/ColorSwatches';
import { Switch } from '@/components/ui/switch';

const DEFAULT_RECORDS_PER_PAGE = 20;
const DEFAULT_CHART_INCOME_COLOR = '#10b981';
const DEFAULT_CHART_EXPENSE_COLOR = '#ef4444';
const DEFAULT_CHART_CAPITAL_COLOR = '#f59e0b';

const defaultDashboardVisibility = {
  summary_cards: true,
  expenses_chart: true,
  last_activity: true,
  current_budget: true,
};

const hexColorRegex = /^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/i;

const createSettingsSchema = (t: Function) => z.object({
  chart_income_color: z.string().regex(hexColorRegex, { message: t('invalidHexColorError') }).nullable().optional(),
  chart_expense_color: z.string().regex(hexColorRegex, { message: t('invalidHexColorError') }).nullable().optional(),
  chart_capital_color: z.string().regex(hexColorRegex, { message: t('invalidHexColorError') }).nullable().optional(),
  records_per_page: z.coerce.number().min(1, { message: t('recordsPerPageMinError') }).max(100, { message: t('recordsPerPageMaxError') }).nullable().optional(),
  dashboard_cards_visibility: z.record(z.boolean()).optional(),
});

type SettingsFormData = z.infer<ReturnType<typeof createSettingsSchema>>;

const dashboardCards = [
  { id: 'summary_cards', labelKey: 'dashboardCardSummary' },
  { id: 'expenses_chart', labelKey: 'dashboardCardExpensesChart' },
  { id: 'last_activity', labelKey: 'dashboardCardLastActivity' },
  { id: 'current_budget', labelKey: 'dashboardCardCurrentBudget' },
];

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, token, fetchUser, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  
  const [isLoadingPageData, setIsLoadingPageData] = useState(true);
  const [isIncomeColorModalOpen, setIsIncomeColorModalOpen] = useState(false);
  const [isExpenseColorModalOpen, setIsExpenseColorModalOpen] = useState(false);
  const [isCapitalColorModalOpen, setIsCapitalColorModalOpen] = useState(false);

  const settingsSchema = useMemo(() => createSettingsSchema(t), [t]);

  const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      chart_income_color: DEFAULT_CHART_INCOME_COLOR,
      chart_expense_color: DEFAULT_CHART_EXPENSE_COLOR,
      chart_capital_color: DEFAULT_CHART_CAPITAL_COLOR,
      records_per_page: DEFAULT_RECORDS_PER_PAGE,
      dashboard_cards_visibility: defaultDashboardVisibility,
    },
  });
  
  const watchedIncomeColor = watch("chart_income_color");
  const watchedExpenseColor = watch("chart_expense_color");
  const watchedCapitalColor = watch("chart_capital_color");

  const fetchSettingsData = useCallback(async () => {
    if (!token) {
        setIsLoadingPageData(false);
        return;
    }
    setIsLoadingPageData(true);
    try {
        const response = await getUserSettings(token); 
        const fetchedSettings = response.settings;    
        
        reset({
            chart_income_color: fetchedSettings?.chart_income_color ?? user?.settings?.chart_income_color ?? DEFAULT_CHART_INCOME_COLOR,
            chart_expense_color: fetchedSettings?.chart_expense_color ?? user?.settings?.chart_expense_color ?? DEFAULT_CHART_EXPENSE_COLOR,
            chart_capital_color: fetchedSettings?.chart_capital_color ?? user?.settings?.chart_capital_color ?? DEFAULT_CHART_CAPITAL_COLOR,
            records_per_page: fetchedSettings?.records_per_page ?? user?.settings?.records_per_page ?? DEFAULT_RECORDS_PER_PAGE,
            dashboard_cards_visibility: {
              ...defaultDashboardVisibility,
              ...fetchedSettings?.dashboard_cards_visibility,
            },
        });
    } catch (error) {
        console.error("Failed to fetch user settings:", error);
        toast({ variant: "destructive", title: t('errorFetchingUserSettings'), description: (error as ApiError).message });
    } finally {
        setIsLoadingPageData(false);
    }
  }, [token, user, reset, toast, t]);

  useEffect(() => {
    if (token && !authIsLoading) {
        fetchSettingsData();
    } else if (!authIsLoading && !token) {
        setIsLoadingPageData(false);
    }
  }, [token, authIsLoading, fetchSettingsData]);

  const handleSaveUserSettings: SubmitHandler<SettingsFormData> = async (data) => {
    if (!token) {
      toast({ variant: "destructive", title: t('error'), description: t('tokenMissingError') });
      return;
    }
    try {
      const payload: Partial<UserSettings> = {
        chart_income_color: data.chart_income_color || null,
        chart_expense_color: data.chart_expense_color || null,
        chart_capital_color: data.chart_capital_color || null,
        records_per_page: data.records_per_page ? Number(data.records_per_page) : null,
        dashboard_cards_visibility: data.dashboard_cards_visibility,
      };
      await updateUserSettings(payload, token);
      await fetchUser();
      toast({
        title: t('userSettingsSavedSuccess'),
        description: t('settingsSavedDesc'),
      });
    } catch (error) {
      const apiError = error as ApiError;
      toast({
        variant: "destructive",
        title: t('errorUpdatingUserSettings'),
        description: apiError.message || t('unexpectedError'),
      });
    }
  };
  
  const effectiveIsLoading = authIsLoading || isLoadingPageData;

  if (effectiveIsLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 max-w-2xl mx-auto">
        <h1 className="font-headline text-3xl font-bold text-foreground">
          {t('settingsPageTitle')}
        </h1>

        <form onSubmit={handleSubmit(handleSaveUserSettings)} className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-primary" />
                {t('dashboardLayoutSettingsTitle')}
              </CardTitle>
              <CardDescription>{t('dashboardLayoutSettingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardCards.map((card) => (
                  <Controller
                    key={card.id}
                    name={`dashboard_cards_visibility.${card.id}`}
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center justify-between rounded-md p-3 bg-muted/30">
                        <Label htmlFor={`visibility-${card.id}`} className="flex-1 cursor-pointer">{t(card.labelKey as any)}</Label>
                        <Switch
                          id={`visibility-${card.id}`}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                {t('chartColorsTitle')}
              </CardTitle>
              <CardDescription>{t('userSettingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chart_income_color_input">{t('chartIncomeColorLabel')}</Label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: watchedIncomeColor || 'transparent' }} />
                  <Controller name="chart_income_color" control={control} render={({ field }) => (<Input id="chart_income_color_input" value={field.value || ''} onChange={field.onChange} readOnly className="flex-grow" placeholder="#10b981"/>)}/>
                  <Dialog open={isIncomeColorModalOpen} onOpenChange={setIsIncomeColorModalOpen}><DialogTrigger asChild><Button type="button" variant="outline"><Palette className="mr-2 h-4 w-4" /> {t('selectColorButton') || "Select"}</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{t('selectIncomeColorTitle') || "Select Income Color"}</DialogTitle></DialogHeader><Controller name="chart_income_color" control={control} render={({ field }) => (<ColorSwatches value={field.value} onChange={(color) => { field.onChange(color); setIsIncomeColorModalOpen(false); }} />)}/></DialogContent></Dialog>
                </div>
                {errors.chart_income_color && <p className="text-sm text-destructive">{errors.chart_income_color.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="chart_expense_color_input">{t('chartExpenseColorLabel')}</Label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: watchedExpenseColor || 'transparent' }} />
                  <Controller name="chart_expense_color" control={control} render={({ field }) => (<Input id="chart_expense_color_input" value={field.value || ''} onChange={field.onChange} readOnly className="flex-grow" placeholder="#ef4444"/>)}/>
                  <Dialog open={isExpenseColorModalOpen} onOpenChange={setIsExpenseColorModalOpen}><DialogTrigger asChild><Button type="button" variant="outline"><Palette className="mr-2 h-4 w-4" /> {t('selectColorButton') || "Select"}</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{t('selectExpenseColorTitle') || "Select Expense Color"}</DialogTitle></DialogHeader><Controller name="chart_expense_color" control={control} render={({ field }) => (<ColorSwatches value={field.value} onChange={(color) => { field.onChange(color); setIsExpenseColorModalOpen(false); }} />)}/></DialogContent></Dialog>
                </div>
                {errors.chart_expense_color && <p className="text-sm text-destructive">{errors.chart_expense_color.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="chart_capital_color_input">{t('chartCapitalColorLabel')}</Label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: watchedCapitalColor || 'transparent' }} />
                  <Controller name="chart_capital_color" control={control} render={({ field }) => (<Input id="chart_capital_color_input" value={field.value || ''} onChange={field.onChange} readOnly className="flex-grow" placeholder="#f59e0b"/>)}/>
                   <Dialog open={isCapitalColorModalOpen} onOpenChange={setIsCapitalColorModalOpen}><DialogTrigger asChild><Button type="button" variant="outline"><Palette className="mr-2 h-4 w-4" /> {t('selectColorButton') || "Select"}</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{t('selectCapitalColorTitle') || "Select Capital Color"}</DialogTitle></DialogHeader><Controller name="chart_capital_color" control={control} render={({ field }) => (<ColorSwatches value={field.value} onChange={(color) => { field.onChange(color); setIsCapitalColorModalOpen(false); }} />)}/></DialogContent></Dialog>
                </div>
                {errors.chart_capital_color && <p className="text-sm text-destructive">{errors.chart_capital_color.message}</p>}
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" />
                {t('displayPreferencesTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:max-w-xs">
                  <Label htmlFor="records_per_page">{t('recordsPerPageLabel')}</Label>
                  <Controller name="records_per_page" control={control} render={({ field }) => (<Input id="records_per_page" type="number" min="1" max="100" placeholder={String(DEFAULT_RECORDS_PER_PAGE)} {...field} value={field.value ?? ''} className={errors.records_per_page ? 'border-destructive' : ''}/>)}/>
                  <p className="text-xs text-muted-foreground">{t('recordsPerPageDesc')}</p>
                  {errors.records_per_page && <p className="text-sm text-destructive">{errors.records_per_page.message}</p>}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || effectiveIsLoading} className="w-full sm:w-auto">
              {(isSubmitting || effectiveIsLoading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {t('saveSettingsButton')}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
