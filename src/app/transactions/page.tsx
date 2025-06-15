
"use client";

import React, { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useAuth } from '@/context/auth-context';
import { getTransactionTypes, createTransaction } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { CalendarIcon, PlusCircle, RefreshCwIcon } from 'lucide-react'; // Changed Repeat to RefreshCwIcon for recurrence
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { TransactionType } from '@/types';
import { useGlobalLoader } from '@/context/global-loader-context';

const recurrenceOptions = [
  { value: 0, labelKey: 'recurrence_one_time' },
  { value: 1, labelKey: 'recurrence_daily' },
  { value: 7, labelKey: 'recurrence_weekly' },
  { value: 14, labelKey: 'recurrence_two_weeks' },
  { value: 30, labelKey: 'recurrence_monthly' },
  { value: 180, labelKey: 'recurrence_six_months' },
  { value: 364, labelKey: 'recurrence_yearly' },
];

const transactionSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive" }),
  description: z.string().min(1, { message: "descriptionRequired" }),
  typeId: z.string().min(1, { message: "typeRequired" }),
  date: z.date({ required_error: "dateRequired" }),
  recurrenceInterval: z.coerce.number().int().min(0).default(0),
});

type TransactionFormInputs = z.infer<typeof transactionSchema>;

export default function TransactionsPage() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setIsLoading: setGlobalLoading } = useGlobalLoader();

  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<TransactionFormInputs>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      typeId: "2", // Default to EXPENSE (assuming "2" is its ID)
      date: new Date(),
      recurrenceInterval: 0, // Default to "One-time"
    },
  });

  useEffect(() => {
    if (isAuthenticated && token) {
      setGlobalLoading(true);
      setIsLoadingTypes(true);
      getTransactionTypes(token)
        .then(data => {
          const filteredTypes = Object.entries(data.types)
            .filter(([key, value]) => value === "INCOME" || value === "EXPENSE")
            .map(([key, value]) => ({ id: key, name: value }));
          setTransactionTypes(filteredTypes);
        })
        .catch(error => {
          console.error("Failed to fetch transaction types", error);
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
        })
        .finally(() => {
          setIsLoadingTypes(false);
          setGlobalLoading(false);
        });
    }
  }, [token, isAuthenticated, t, toast, setGlobalLoading]);

  const onSubmit: SubmitHandler<TransactionFormInputs> = async (data) => {
    if (!token) return;
    setIsSubmitting(true);
    setGlobalLoading(true);

    const payload = {
      amount: Math.round(data.amount * 100), // Convert to cents
      description: data.description,
      typeId: data.typeId,
      date: format(data.date, 'yyyy-MM-dd'), // Format date for API
      isRecurring: data.recurrenceInterval > 0,
      // If API needed interval: recurrenceInterval: data.recurrenceInterval
    };

    try {
      await createTransaction(payload, token);
      toast({ title: t('transactionSavedTitle'), description: t('transactionSavedDesc') });
      reset(); // Reset form after successful submission
    } catch (error: any) {
      console.error("Failed to create transaction", error);
      toast({ variant: "destructive", title: t('transactionFailedTitle'), description: error.message || t('unexpectedError') });
    } finally {
      setIsSubmitting(false);
      setGlobalLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-3xl font-bold text-foreground">{t('transactions')}</h1>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-semibold text-foreground">
              <PlusCircle className="mr-2 h-6 w-6 text-primary" />
              {t('newTransaction')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount">{t('amount')}</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('amount')}
                    aria-invalid={errors.amount ? "true" : "false"}
                  />
                  {errors.amount && <p className="text-sm text-destructive">{errors.amount.message?.startsWith("Amount must be positive") ? errors.amount.message : t(errors.amount.message as keyof ReturnType<typeof useTranslation>['translations'])}</p>}
                </div>

                {/* Transaction Type */}
                <div className="space-y-2">
                  <Label htmlFor="typeId">{t('transactionType')}</Label>
                  <Controller
                    name="typeId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingTypes}>
                        <SelectTrigger id="typeId" aria-invalid={errors.typeId ? "true" : "false"}>
                          <SelectValue placeholder={isLoadingTypes ? t('loading') : t('selectTypePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {transactionTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              {t(`transactionType_${type.name}` as keyof ReturnType<typeof useTranslation>['translations'])}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.typeId && <p className="text-sm text-destructive">{t(errors.typeId.message as keyof ReturnType<typeof useTranslation>['translations'])}</p>}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t('description')}</Label>
                <Input
                  id="description"
                  placeholder={t('descriptionPlaceholder')}
                  {...register('description')}
                  aria-invalid={errors.description ? "true" : "false"}
                />
                {errors.description && <p className="text-sm text-destructive">{t(errors.description.message as keyof ReturnType<typeof useTranslation>['translations'])}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">{t('date')}</Label>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="date"
                            variant={"outline"}
                            className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            aria-invalid={errors.date ? "true" : "false"}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>{t('selectDate')}</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")} // Disable future dates
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.date && <p className="text-sm text-destructive">{t(errors.date.message as keyof ReturnType<typeof useTranslation>['translations'])}</p>}
                </div>

                {/* Recurrence Interval */}
                <div className="space-y-2">
                  <Label htmlFor="recurrenceInterval">{t('recurrenceIntervalLabel')}</Label>
                  <Controller
                    name="recurrenceInterval"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={String(field.value)}>
                        <SelectTrigger id="recurrenceInterval" aria-invalid={errors.recurrenceInterval ? "true" : "false"}>
                          <RefreshCwIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder={t('recurrenceIntervalPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {recurrenceOptions.map(option => (
                            <SelectItem key={option.value} value={String(option.value)}>
                              {t(option.labelKey as keyof ReturnType<typeof useTranslation>['translations'])}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.recurrenceInterval && <p className="text-sm text-destructive">{t(errors.recurrenceInterval.message as keyof ReturnType<typeof useTranslation>['translations'], {defaultValue: errors.recurrenceInterval.message})}</p>}
                </div>
              </div>

              <Button type="submit" className="w-full md:w-auto font-semibold" disabled={isSubmitting || isLoadingTypes}>
                 {(isSubmitting || isLoadingTypes) && (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {t('saveTransaction')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Placeholder for transaction list */}
        <div className="mt-8">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>{t('recentTransactionsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('transactionListPlaceholder')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

