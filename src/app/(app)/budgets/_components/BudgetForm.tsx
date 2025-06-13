
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Budget, MainCategory } from '@/lib/definitions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMonthName } from '@/lib/utils'; // We'll create this helper

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i); // Last 5 and next 5 years
const months = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12

const budgetFormSchema = z.object({
  mainCategoryId: z.string().min(1, { message: 'Main category is required.' }),
  plannedAmount: z.coerce.number().positive({ message: 'Planned amount must be positive.' }),
  month: z.coerce.number().min(1).max(12, { message: 'Month is required.' }),
  year: z.coerce.number().min(currentYear - 20).max(currentYear + 20, { message: 'Year is required.' }),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

interface BudgetFormProps {
  initialData?: Budget | null;
  onSubmitAction: (data: BudgetFormValues) => Promise<Budget | null>;
  mainCategories: MainCategory[];
  translations: any; // From budgetsPage namespace
  locale: string;
}

export function BudgetForm({ initialData, onSubmitAction, mainCategories, translations, locale }: BudgetFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const defaultValues = initialData
    ? {
        mainCategoryId: initialData.mainCategoryId,
        plannedAmount: initialData.plannedAmount,
        month: initialData.month,
        year: initialData.year,
      }
    : {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        plannedAmount: 0,
      };

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues,
  });

  async function onSubmit(data: BudgetFormValues) {
    setIsSubmitting(true);
    try {
      const result = await onSubmitAction(data);
      if (result) {
        const categoryName = mainCategories.find(mc => mc.id === result.mainCategoryId)?.name || '';
        const monthYear = `${getMonthName(result.month, locale)} ${result.year}`;
        toast({
          title: initialData ? translations.successUpdateToastTitle : translations.successCreateToastTitle,
          description: initialData 
            ? translations.successUpdateToastDescription.replace('{categoryName}', categoryName).replace('{monthYear}', monthYear)
            : translations.successCreateToastDescription.replace('{categoryName}', categoryName).replace('{monthYear}', monthYear),
        });
        router.push(`/${locale}/budgets`);
        router.refresh(); // Important to re-fetch budget list
      } else {
        throw new Error('Failed to save budget');
      }
    } catch (error) {
      toast({
        title: translations.errorToastTitle,
        description: translations.errorToastDescription.replace('{error}', error instanceof Error ? error.message : String(error)),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">
          {initialData ? translations.editBudgetTitle : translations.newBudgetTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="mainCategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.mainCategoryLabel}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={translations.mainCategoryPlaceholder} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mainCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="plannedAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{translations.plannedAmountLabel}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.monthLabel}</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={translations.monthPlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {months.map((monthNum) => (
                          <SelectItem key={monthNum} value={String(monthNum)}>
                            {getMonthName(monthNum, locale)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations.yearLabel}</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={translations.yearPlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map((yearNum) => (
                          <SelectItem key={yearNum} value={String(yearNum)}>
                            {yearNum}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || mainCategories.length === 0}>
                {isSubmitting ? (initialData ? 'Saving...' : 'Creating...') : (initialData ? translations.saveButton : translations.createButton)}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
