
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';

import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { getTransactionTypes, createTransaction } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import type { TransactionType } from '@/types';
import { CalendarIcon, Save, ArrowLeft } from 'lucide-react';
import { useGlobalLoader } from '@/context/global-loader-context';

const recurrenceOptions = [
  { value: "0", labelKey: "recurrence_one_time" },
  { value: "1", labelKey: "recurrence_daily" },
  { value: "7", labelKey: "recurrence_weekly" },
  { value: "14", labelKey: "recurrence_two_weeks" },
  { value: "30", labelKey: "recurrence_monthly" },
  { value: "180", labelKey: "recurrence_six_months" },
  { value: "365", labelKey: "recurrence_yearly" },
];

export default function NewTransactionPage() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const { setIsLoading: setGlobalLoading } = useGlobalLoader();

  const NewTransactionSchema = z.object({
    amount: z.coerce.number().positive({ message: t('amountPositiveError') }),
    description: z.string().min(1, { message: t('descriptionRequired') }).max(100, { message: t('descriptionTooLongError')}),
    typeId: z.string().min(1, { message: t('typeRequired') }),
    date: z.date({ required_error: t('dateRequired') }),
    recurrenceInterval: z.string().min(1, { message: t('recurrenceRequiredError')}),
  });

  type NewTransactionFormData = z.infer<typeof NewTransactionSchema>;

  const { control, handleSubmit, formState: { errors, isSubmitting }, register } = useForm<NewTransactionFormData>({
    resolver: zodResolver(NewTransactionSchema),
    defaultValues: {
      amount: undefined,
      description: '',
      typeId: '',
      date: new Date(),
      recurrenceInterval: "0", 
    },
  });

  useEffect(() => {
    // If types are already in state, don't do anything.
    if (transactionTypes.length > 0) {
      setIsLoadingTypes(false);
      // Intentionally not setting global loading false here, 
      // as other operations might still be pending for the page.
      // Global loader should be managed by the overall page loading lifecycle.
      return;
    }

    const typesFromQuery = searchParams.get('types');
    if (typesFromQuery) {
      try {
        const parsedTypes = JSON.parse(typesFromQuery) as TransactionType[];
        if (Array.isArray(parsedTypes) && parsedTypes.every(type => typeof type.id === 'string' && typeof type.name === 'string')) {
          setTransactionTypes(parsedTypes);
          setIsLoadingTypes(false);
          // setGlobalLoading(false); // Avoid premature global loader stop
          return; // Types loaded from query, exit
        } else {
          console.warn("Parsed types from query params have invalid structure:", parsedTypes);
        }
      } catch (e) {
        console.error("Failed to parse transaction types from query params:", e);
      }
    }

    // If not returned by now, types were not in state and not in query params (or invalid)
    // So, fetch them.
    if (isAuthenticated && token) {
      setGlobalLoading(true); // Set global loading only if we are about to fetch
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
          setGlobalLoading(false); // Stop global loading after fetch attempt
        });
    } else {
      // Not authenticated or no token, and types not available from query or state
      setIsLoadingTypes(false);
      setGlobalLoading(false); // Ensure loader is off if no fetch is attempted
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated, searchParams, transactionTypes.length]);
  // Removed t, toast, setGlobalLoading from dependencies as they are stable or their change doesn't necessitate re-fetching types.
  // transactionTypes.length ensures effect re-evaluates if types are set (e.g. from query), then bails out early.


  const onSubmit: SubmitHandler<NewTransactionFormData> = async (data) => {
    if (!token) {
      toast({ variant: "destructive", title: t('error'), description: t('tokenMissingError') });
      return;
    }
    setGlobalLoading(true);
    try {
      const payload = {
        amount: Math.round(data.amount * 100), // Convert to cents
        description: data.description,
        typeId: data.typeId,
        date: format(data.date, 'yyyy-MM-dd'),
        isRecurring: parseInt(data.recurrenceInterval, 10) > 0, 
      };
      await createTransaction(payload, token);
      toast({
        title: t('transactionSavedTitle'),
        description: t('transactionSavedDesc'),
      });
      router.push('/transactions');
    } catch (error: any) {
      console.error("Failed to save transaction", error);
      toast({
        variant: "destructive",
        title: t('transactionFailedTitle'),
        description: error.message || t('unexpectedError'),
      });
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-3xl font-bold text-foreground">{t('newTransactionTitle')}</h1>
           <Button variant="outline" onClick={() => router.back()} className="mb-4 sm:mb-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backButton')}
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('enterTransactionDetails')}</CardTitle>
            <CardDescription>{t('fillFormBelow')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">{t('amount')}</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    {...register('amount')}
                    placeholder={t('amountPlaceholder', { currency: '$' })} 
                    className={errors.amount ? 'border-destructive' : ''}
                  />
                  {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typeId">{t('transactionType')}</Label>
                  <Controller
                    name="typeId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoadingTypes || transactionTypes.length === 0}
                      >
                        <SelectTrigger id="typeId" className={errors.typeId ? 'border-destructive' : ''}>
                          <SelectValue placeholder={isLoadingTypes ? t('loading') : (transactionTypes.length === 0 ? t('noTypesAvailable') : t('selectTypePlaceholder'))} />
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
                  {errors.typeId && <p className="text-sm text-destructive">{errors.typeId.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('description')}</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder={t('descriptionPlaceholder')}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${errors.date ? 'border-destructive' : ''}`}
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
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurrenceInterval">{t('recurrenceIntervalLabel')}</Label>
                  <Controller
                    name="recurrenceInterval"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger id="recurrenceInterval" className={errors.recurrenceInterval ? 'border-destructive' : ''}>
                          <SelectValue placeholder={t('recurrenceIntervalPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {recurrenceOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {t(option.labelKey as keyof ReturnType<typeof useTranslation>['translations'])}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.recurrenceInterval && <p className="text-sm text-destructive">{errors.recurrenceInterval.message}</p>}
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting || isLoadingTypes}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? t('saving') : t('saveTransaction')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
