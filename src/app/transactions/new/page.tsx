
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import type { TransactionType as AppTransactionType } from '@/types'; // Renamed to avoid conflict
import { CalendarIcon, Save, ArrowLeft } from 'lucide-react';
import { useGlobalLoader } from '@/context/global-loader-context';

const recurrenceOptions = [
  { value: "0", labelKey: "recurrence_one_time" },
  // Add other recurrence options if the API supports them or if client-side logic handles them.
  // For now, the API payload only has `isRecurring: boolean`.
  // If more complex recurrence is needed, the API and this form need to be extended.
];

export default function NewTransactionPage() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const [transactionTypes, setTransactionTypes] = useState<AppTransactionType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const { setIsLoading: setGlobalLoading } = useGlobalLoader();

  const NewTransactionSchema = z.object({
    amount: z.coerce.number().positive({ message: t('amountPositiveError') }),
    description: z.string().max(255, { message: t('descriptionTooLongError')}).optional().nullable(), // Optional description
    typeId: z.string().min(1, { message: t('typeRequired') }), // This will be string ID from AppTransactionType ("1", "2")
    date: z.date({ required_error: t('dateRequired') }),
    isRecurring: z.boolean(), // Simplified to boolean based on API documentation
    // currencyCode: z.string().min(3, "Currency code is required").default("USD"), // Add if currency can be selected
  });

  type NewTransactionFormData = z.infer<typeof NewTransactionSchema>;

  const { control, handleSubmit, formState: { errors, isSubmitting }, register } = useForm<NewTransactionFormData>({
    resolver: zodResolver(NewTransactionSchema),
    defaultValues: {
      amount: undefined,
      description: '',
      typeId: '', // Default to empty, user must select
      date: new Date(),
      isRecurring: false,
    },
  });

  useEffect(() => {
    if (isAuthenticated && token) {
      setGlobalLoading(true);
      setIsLoadingTypes(true);
      getTransactionTypes(token)
        .then(data => {
          const formattedTypes = Object.entries(data.types)
            .map(([id, name]) => ({ id, name: name as string }));
          setTransactionTypes(formattedTypes);
          // Set default typeId if applicable, e.g., to EXPENSE ("2")
          // For now, let user select.
        })
        .catch(error => {
          console.error("Failed to fetch transaction types", error);
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
        })
        .finally(() => {
          setIsLoadingTypes(false);
          setGlobalLoading(false);
        });
    } else {
      setIsLoadingTypes(false);
      setGlobalLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated]);

  const onSubmit: SubmitHandler<NewTransactionFormData> = async (data) => {
    if (!token) {
      toast({ variant: "destructive", title: t('error'), description: t('tokenMissingError') });
      return;
    }
    setGlobalLoading(true);
    try {
      // API expects amount in cents. New API structure amount is { amount: number, currency: { code: string } }
      // The form collects `amount` as a float.
      // The createTransaction API endpoint in API_DOCUMENTATION.md expects:
      // { "amount": 5000, "description": "...", "typeId": "2", "date": "YYYY-MM-DD", "isRecurring": false }
      // So, we need to ensure `typeId` is the string ID ("1", "2") that matches the fetched types.
      // And amount is in cents.
      const payload = {
        amount: Math.round(data.amount * 100), 
        description: data.description || null, // Send null if empty
        typeId: data.typeId, // This is already "1" or "2" from the select
        date: format(data.date, 'yyyy-MM-dd'),
        isRecurring: data.isRecurring, 
        // currency: data.currencyCode, // Add if currency selection is implemented
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
                          <SelectValue placeholder={isLoadingTypes ? t('loading') : (transactionTypes.length === 0 ? t('selectTypePlaceholder') : t('selectTypePlaceholder'))} />
                        </SelectTrigger>
                        <SelectContent>
                          {transactionTypes.map(type => (
                            // type.id is string "1", "2"; type.name is "INCOME", "EXPENSE"
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
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

                <div className="space-y-2 flex items-center gap-x-2 pt-6">
                   <Controller
                    name="isRecurring"
                    control={control}
                    render={({ field }) => (
                       <Input
                        id="isRecurring"
                        type="checkbox"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="h-4 w-4"
                      />
                    )}
                  />
                  <Label htmlFor="isRecurring" className="cursor-pointer">{t('recurringTransaction')}</Label>
                  {errors.isRecurring && <p className="text-sm text-destructive">{errors.isRecurring.message}</p>}
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
