
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { UserSettings } from '@/lib/definitions';
import { useRouter } from 'next/navigation';

const settingsFormSchema = z.object({
  transactionsPerPage: z.coerce
    .number()
    .int({ message: 'Must be a whole number.' })
    .positive({ message: 'Must be a positive number.' })
    .min(1, { message: 'Must be at least 1.' })
    .max(100, { message: 'Cannot exceed 100.' }),
  showTotalBalanceCard: z.boolean().optional(),
  showMonthlyIncomeCard: z.boolean().optional(),
  showMonthlyExpensesCard: z.boolean().optional(),
  showAverageSpendingCard: z.boolean().optional(),
  showExpenseChartCard: z.boolean().optional(),
  showRecentActivityCard: z.boolean().optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

interface SettingsFormProps {
  initialSettings: UserSettings;
  onSubmitAction: (data: SettingsFormValues) => Promise<any>; 
  translations: {
    transactionsPerPage: string;
    transactionsPerPageDescription: string;
    dashboardSettingsTitle: string;
    dashboardSettingsDescription: string;
    showTotalBalanceCardLabel: string;
    showTotalBalanceCardDescription: string;
    showMonthlyIncomeCardLabel: string;
    showMonthlyIncomeCardDescription: string;
    showMonthlyExpensesCardLabel: string;
    showMonthlyExpensesCardDescription: string;
    showAverageSpendingCardLabel: string;
    showAverageSpendingCardDescription: string;
    showExpenseChartCardLabel: string;
    showExpenseChartCardDescription: string;
    showRecentActivityCardLabel: string;
    showRecentActivityCardDescription: string;
    saveButton: string;
    successToastTitle: string;
    successToastDescription: string;
    errorToastTitle: string;
    errorToastDescription: string;
  };
}

export const dashboardVisibilityLocalStorageKeys = {
  showTotalBalanceCard: 'dashboard_visibility_showTotalBalanceCard',
  showMonthlyIncomeCard: 'dashboard_visibility_showMonthlyIncomeCard',
  showMonthlyExpensesCard: 'dashboard_visibility_showMonthlyExpensesCard',
  showAverageSpendingCard: 'dashboard_visibility_showAverageSpendingCard',
  showExpenseChartCard: 'dashboard_visibility_showExpenseChartCard',
  showRecentActivityCard: 'dashboard_visibility_showRecentActivityCard',
};

export function SettingsForm({ initialSettings, onSubmitAction, translations }: SettingsFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      transactionsPerPage: initialSettings?.transactionsPerPage || 10,
      showTotalBalanceCard: initialSettings?.showTotalBalanceCard !== false,
      showMonthlyIncomeCard: initialSettings?.showMonthlyIncomeCard !== false,
      showMonthlyExpensesCard: initialSettings?.showMonthlyExpensesCard !== false,
      showAverageSpendingCard: initialSettings?.showAverageSpendingCard !== false,
      showExpenseChartCard: initialSettings?.showExpenseChartCard !== false,
      showRecentActivityCard: initialSettings?.showRecentActivityCard !== false,
    },
  });

  async function onSubmit(data: SettingsFormValues) {
    setIsSubmitting(true);
    try {
      await onSubmitAction(data); // Server update

      // Client-side localStorage update for immediate effect
      if (typeof window !== 'undefined') {
        Object.entries(dashboardVisibilityLocalStorageKeys).forEach(([key, localStorageKey]) => {
          const formKey = key as keyof SettingsFormValues;
          if (data[formKey] !== undefined) {
            localStorage.setItem(localStorageKey, String(data[formKey]));
          }
        });
         // Dispatch a storage event to notify other components/tabs immediately
        window.dispatchEvent(new StorageEvent('storage', { key: 'dashboard_settings_updated', newValue: Date.now().toString() }));
      }

      toast({
        title: translations.successToastTitle,
        description: translations.successToastDescription,
      });
      router.refresh(); 
    } catch (error) {
      toast({
        title: translations.errorToastTitle,
        description: `${translations.errorToastDescription} ${error instanceof Error ? error.message : ''}`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const dashboardToggleFields = Object.keys(dashboardVisibilityLocalStorageKeys) as (keyof SettingsFormValues)[];


  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div>
              <FormField
                control={form.control}
                name="transactionsPerPage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.transactionsPerPage}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 10" {...field} disabled={isSubmitting} className="max-w-xs"/>
                    </FormControl>
                    <FormDescription>
                      {translations.transactionsPerPageDescription}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium font-headline">{translations.dashboardSettingsTitle}</h3>
              <p className="text-sm text-muted-foreground mb-4">{translations.dashboardSettingsDescription}</p>
              <div className="space-y-4">
                {dashboardToggleFields.map((fieldName) => (
                   <FormField
                    key={fieldName}
                    control={form.control}
                    name={fieldName as any} // Cast to any due to dynamic nature
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>{translations[`${fieldName}Label` as keyof typeof translations]}</FormLabel>
                          <FormDescription>
                            {translations[`${fieldName}Description` as keyof typeof translations]}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : translations.saveButton}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
