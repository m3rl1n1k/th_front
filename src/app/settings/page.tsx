
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/context/i18n-context';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Save, Info, Palette, ListChecks, Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { updateUserSettings } from '@/lib/api';
import type { UserSettings, ApiError } from '@/types';

const GEMINI_API_KEY_STORAGE_KEY = 'financeflow_gemini_api_key';
const DEFAULT_RECORDS_PER_PAGE = 20;
const DEFAULT_CHART_INCOME_COLOR = '#10b981'; // Tailwind green-500
const DEFAULT_CHART_EXPENSE_COLOR = '#ef4444'; // Tailwind red-500
const DEFAULT_CHART_CAPITAL_COLOR = '#f59e0b'; // Tailwind amber-500

const hexColorRegex = /^#([0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/i;

const createSettingsSchema = (t: Function) => z.object({
  chart_income_color: z.string()
    .regex(hexColorRegex, { message: t('invalidHexColorError') })
    .nullable().optional(),
  chart_expense_color: z.string()
    .regex(hexColorRegex, { message: t('invalidHexColorError') })
    .nullable().optional(),
  chart_capital_color: z.string()
    .regex(hexColorRegex, { message: t('invalidHexColorError') })
    .nullable().optional(),
  records_per_page: z.coerce
    .number()
    .min(1, { message: t('recordsPerPageMinError') })
    .max(100, { message: t('recordsPerPageMaxError') })
    .nullable().optional(),
});

type SettingsFormData = z.infer<ReturnType<typeof createSettingsSchema>>;

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, token, fetchUser, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();
  
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [isLoadingPage, setIsLoadingPage] = useState(true);

  const settingsSchema = useMemo(() => createSettingsSchema(t), [t]);

  const { control, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      chart_income_color: user?.settings?.chart_income_color || DEFAULT_CHART_INCOME_COLOR,
      chart_expense_color: user?.settings?.chart_expense_color || DEFAULT_CHART_EXPENSE_COLOR,
      chart_capital_color: user?.settings?.chart_capital_color || DEFAULT_CHART_CAPITAL_COLOR,
      records_per_page: user?.settings?.records_per_page || DEFAULT_RECORDS_PER_PAGE,
    },
  });

  const watchedIncomeColor = watch('chart_income_color');
  const watchedExpenseColor = watch('chart_expense_color');
  const watchedCapitalColor = watch('chart_capital_color');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedApiKey = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
      if (storedApiKey) {
        setGeminiApiKey(storedApiKey);
      }
    }
  }, []);

  useEffect(() => {
    if (user && !authIsLoading) {
      reset({
        chart_income_color: user.settings?.chart_income_color || DEFAULT_CHART_INCOME_COLOR,
        chart_expense_color: user.settings?.chart_expense_color || DEFAULT_CHART_EXPENSE_COLOR,
        chart_capital_color: user.settings?.chart_capital_color || DEFAULT_CHART_CAPITAL_COLOR,
        records_per_page: user.settings?.records_per_page || DEFAULT_RECORDS_PER_PAGE,
      });
      setIsLoadingPage(false);
    } else if (!authIsLoading && !user) {
      setIsLoadingPage(false); 
    }
  }, [user, authIsLoading, reset]);


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
      };
      await updateUserSettings(payload, token);
      await fetchUser(); // Refresh user context
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

  const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGeminiApiKey(event.target.value);
  };

  const handleSaveApiKey = () => {
    if (typeof window !== 'undefined') {
      if (geminiApiKey.trim()) {
        localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, geminiApiKey.trim());
        toast({
          title: t('geminiApiKeySavedTitle'),
          description: t('geminiApiKeySavedDesc'),
        });
      } else {
        localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
         toast({
          title: t('geminiApiKeyRemovedTitle'),
          description: t('geminiApiKeyRemovedDesc'),
        });
      }
    }
  };

  if (isLoadingPage && authIsLoading) {
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

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('userSettingsTitle')}</CardTitle>
            <CardDescription>{t('userSettingsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleSaveUserSettings)} className="space-y-6">
              <fieldset className="space-y-4 p-4 border rounded-md">
                <legend className="text-lg font-medium px-1 flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  {t('chartColorsTitle')}
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="chart_income_color">{t('chartIncomeColorLabel')}</Label>
                    <div className="flex items-center gap-2">
                      <Controller
                        name="chart_income_color"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="chart_income_color"
                            type="text"
                            placeholder={DEFAULT_CHART_INCOME_COLOR}
                            {...field}
                            value={field.value || ''}
                            className={errors.chart_income_color ? 'border-destructive' : ''}
                          />
                        )}
                      />
                      <div 
                        className="w-8 h-8 rounded border border-input shrink-0" 
                        style={{ backgroundColor: watchedIncomeColor || DEFAULT_CHART_INCOME_COLOR }}
                        title={t('colorPreview') || 'Color Preview'}
                      />
                    </div>
                    {errors.chart_income_color && <p className="text-sm text-destructive">{errors.chart_income_color.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chart_expense_color">{t('chartExpenseColorLabel')}</Label>
                     <div className="flex items-center gap-2">
                        <Controller
                            name="chart_expense_color"
                            control={control}
                            render={({ field }) => (
                            <Input
                                id="chart_expense_color"
                                type="text"
                                placeholder={DEFAULT_CHART_EXPENSE_COLOR}
                                {...field}
                                value={field.value || ''}
                                className={errors.chart_expense_color ? 'border-destructive' : ''}
                            />
                            )}
                        />
                        <div 
                            className="w-8 h-8 rounded border border-input shrink-0" 
                            style={{ backgroundColor: watchedExpenseColor || DEFAULT_CHART_EXPENSE_COLOR }}
                            title={t('colorPreview') || 'Color Preview'}
                        />
                    </div>
                    {errors.chart_expense_color && <p className="text-sm text-destructive">{errors.chart_expense_color.message}</p>}
                  </div>
                </div>
                <div className="space-y-2 sm:max-w-[calc(50%-0.5rem)]"> {/* Aligns with one column */}
                    <Label htmlFor="chart_capital_color">{t('chartCapitalColorLabel')}</Label>
                     <div className="flex items-center gap-2">
                        <Controller
                            name="chart_capital_color"
                            control={control}
                            render={({ field }) => (
                            <Input
                                id="chart_capital_color"
                                type="text"
                                placeholder={DEFAULT_CHART_CAPITAL_COLOR}
                                {...field}
                                value={field.value || ''}
                                className={errors.chart_capital_color ? 'border-destructive' : ''}
                            />
                            )}
                        />
                        <div 
                            className="w-8 h-8 rounded border border-input shrink-0" 
                            style={{ backgroundColor: watchedCapitalColor || DEFAULT_CHART_CAPITAL_COLOR }}
                            title={t('colorPreview') || 'Color Preview'}
                        />
                    </div>
                    {errors.chart_capital_color && <p className="text-sm text-destructive">{errors.chart_capital_color.message}</p>}
                  </div>
              </fieldset>
              
              <fieldset className="space-y-4 p-4 border rounded-md">
                 <legend className="text-lg font-medium px-1 flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-primary" />
                  {t('displayPreferencesTitle')}
                </legend>
                <div className="space-y-2 sm:max-w-xs">
                    <Label htmlFor="records_per_page">{t('recordsPerPageLabel')}</Label>
                    <Controller
                        name="records_per_page"
                        control={control}
                        render={({ field }) => (
                        <Input
                            id="records_per_page"
                            type="number"
                            min="1"
                            max="100"
                            placeholder={String(DEFAULT_RECORDS_PER_PAGE)}
                            {...field}
                            value={field.value || ''}
                            className={errors.records_per_page ? 'border-destructive' : ''}
                        />
                        )}
                    />
                    <p className="text-xs text-muted-foreground">{t('recordsPerPageDesc')}</p>
                    {errors.records_per_page && <p className="text-sm text-destructive">{errors.records_per_page.message}</p>}
                </div>
              </fieldset>

              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {t('saveSettingsButton')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('geminiApiKeySettingsTitle')}</CardTitle>
            <CardDescription>{t('geminiApiKeySettingsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="geminiApiKey">{t('geminiApiKeyLabel')}</Label>
              <Input
                id="geminiApiKey"
                type="password"
                value={geminiApiKey}
                onChange={handleApiKeyChange}
                placeholder={t('geminiApiKeyPlaceholder')}
              />
            </div>
             <Alert variant="default" className="bg-primary/5 border-primary/20 text-primary-foreground dark:bg-primary/10 dark:border-primary/30">
              <Info className="h-4 w-4 !text-primary" />
              <AlertDescription className="text-xs">
                {t('geminiApiKeyNote')}
              </AlertDescription>
            </Alert>
            <Button onClick={handleSaveApiKey} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {t('geminiApiKeySaveButton')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
```