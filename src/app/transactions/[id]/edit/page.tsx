
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';

import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import {
  getTransactionById,
  updateTransaction,
  getTransactionTypes,
  getTransactionFrequencies,
  getWalletsList,
  getMainCategories
} from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import type { Transaction, TransactionType as AppTransactionType, Frequency, WalletDetails, MainCategory as ApiMainCategory, UpdateTransactionPayload } from '@/types';
import { CalendarIcon, Save, ArrowLeft, Repeat, Landmark, Shapes, Loader2, AlertTriangle } from 'lucide-react';
import { CurrencyDisplay } from '@/components/common/currency-display';

const generateCategoryTranslationKey = (name: string | undefined | null): string => {
  if (!name) return '';
  return name.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

const FREQUENCY_NAME_TO_TRANSLATION_SUFFIX: Record<string, string> = {
  "ONE_TIME": "0",
  "DAILY": "1",
  "WEEKLY": "7",
  "EVERY_TWO_WEEKS": "14",
  "MONTHLY": "30",
  "EVERY_6_MONTHS": "180",
  "HALFYEARLY": "180", // Added to handle this variation
  "YEARLY": "365",
};

const EditTransactionSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be a positive number." }), 
  description: z.string().max(255).optional().nullable(),
  typeId: z.string().min(1, { message: "Type is required." }),
  date: z.date({ required_error: "Date is required." }),
  walletId: z.string().min(1, { message: "Wallet is required." }),
  categoryId: z.string().optional().nullable(),
  frequencyId: z.string().min(1, { message: "Frequency is required." }),
});

type EditTransactionFormData = z.infer<typeof EditTransactionSchema>;

export default function EditTransactionPage() {
  const { token, isAuthenticated, user } = useAuth();
  const { t, dateFnsLocale } = useTranslation(); 
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [isLoadingTransaction, setIsLoadingTransaction] = useState(true);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  
  const [transactionTypes, setTransactionTypes] = useState<AppTransactionType[]>([]);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [wallets, setWallets] = useState<WalletDetails[]>([]);
  const [mainCategoriesHierarchical, setMainCategoriesHierarchical] = useState<ApiMainCategory[]>([]);

  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [isLoadingFrequencies, setIsLoadingFrequencies] = useState(true);
  const [isLoadingWallets, setIsLoadingWallets] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const { control, handleSubmit, formState: { errors }, register, reset } = useForm<EditTransactionFormData>({
    resolver: zodResolver(EditTransactionSchema),
    defaultValues: {
      amount: undefined,
      description: '',
      typeId: '',
      date: new Date(),
      walletId: '',
      categoryId: null,
      frequencyId: '',
    },
  });

  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoadingTypes(true);
      getTransactionTypes(token)
        .then(data => setTransactionTypes(Object.entries(data.types).map(([id, name]) => ({ id, name: name as string })).filter(type => type.name.toUpperCase() !== 'TRANSFER')))
        .catch(error => toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message }))
        .finally(() => setIsLoadingTypes(false));

      setIsLoadingFrequencies(true);
      getTransactionFrequencies(token)
        .then(data => setFrequencies(Object.entries(data.periods).map(([id, name]) => ({ id, name: name as string }))))
        .catch(error => toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message }))
        .finally(() => setIsLoadingFrequencies(false));
      
      setIsLoadingWallets(true);
      getWalletsList(token)
        .then(data => setWallets(data.wallets || []))
        .catch(error => toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message }))
        .finally(() => setIsLoadingWallets(false));

      setIsLoadingCategories(true);
      getMainCategories(token)
        .then(mainCategoriesResponse => setMainCategoriesHierarchical(Array.isArray(mainCategoriesResponse) ? mainCategoriesResponse : []))
        .catch(error => toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message }))
        .finally(() => setIsLoadingCategories(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated, t, toast]);

  useEffect(() => {
    if (id && token && !isLoadingTypes && !isLoadingFrequencies && !isLoadingWallets && !isLoadingCategories) {
      setIsLoadingTransaction(true);
      getTransactionById(id, token)
        .then(data => {
          setTransactionToEdit(data);
          reset({
            amount: data.amount.amount / 100,
            description: data.description || '',
            typeId: String(data.type),
            date: parseISO(data.date),
            walletId: String(data.wallet.id),
            categoryId: data.subCategory?.id ? String(data.subCategory.id) : null,
            frequencyId: String(data.frequencyId),
          });
        })
        .catch(error => {
          toast({ variant: "destructive", title: t('errorFetchingTransactionForEdit'), description: error.message });
          setErrorOccurred(true);
        })
        .finally(() => setIsLoadingTransaction(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, reset, toast, t, isLoadingTypes, isLoadingFrequencies, isLoadingWallets, isLoadingCategories]);

  const [errorOccurred, setErrorOccurred] = useState(false);


  const onSubmit: SubmitHandler<EditTransactionFormData> = async (data) => {
    if (!token || !id) {
      toast({ variant: "destructive", title: t('error'), description: t('tokenMissingError') });
      return;
    }
    setIsSubmittingForm(true);
    try {
      const payload: UpdateTransactionPayload = {
        amount: Math.round(data.amount * 100),
        description: data.description || null,
        typeId: data.typeId,
        date: format(data.date, 'yyyy-MM-dd'),
        wallet_id: parseInt(data.walletId),
        category_id: data.categoryId ? parseInt(data.categoryId) : null,
        frequencyId: data.frequencyId,
      };
      await updateTransaction(id, payload, token);
      toast({
        title: t('transactionUpdatedTitle'),
        description: t('transactionUpdatedDesc'),
      });
      router.push('/transactions');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('transactionUpdateFailedTitle'),
        description: error.message || t('unexpectedError'),
      });
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const anyDataLoading = isLoadingTypes || isLoadingWallets || isLoadingCategories || isLoadingFrequencies || isLoadingTransaction;

  if (anyDataLoading && !errorOccurred) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  if (errorOccurred) {
     return (
      <MainLayout>
        <Card className="max-w-2xl mx-auto shadow-lg border-destructive">
          <CardHeader className="bg-destructive/10">
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" />
              {t('errorFetchingTransactionForEdit')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p>{t('couldNotLoadTransactionEdit')}</p>
          </CardContent>
           <CardFooter className="flex justify-end">
            <Button variant="outline" onClick={() => router.push('/transactions')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backButton')}
            </Button>
          </CardFooter>
        </Card>
      </MainLayout>
    );
  }


  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-3xl font-bold text-foreground">{t('editTransactionTitle')} #{id}</h1>
          <Button variant="outline" onClick={() => router.back()} className="mb-4 sm:mb-0">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backButton')}
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('updateTransactionDetails')}</CardTitle>
            <CardDescription>{t('modifyFormBelow')}</CardDescription>
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
                    placeholder={t('amountPlaceholder', { currency: user?.userCurrency?.code || '$' })}
                    className={errors.amount ? 'border-destructive' : ''}
                  />
                  {errors.amount && <p className="text-sm text-destructive">{t(errors.amount.message as any) || errors.amount.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typeId">{t('transactionType')}</Label>
                  <Controller
                    name="typeId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingTypes || transactionTypes.length === 0}
                      >
                        <SelectTrigger id="typeId" className={errors.typeId ? 'border-destructive' : ''}>
                          <SelectValue placeholder={isLoadingTypes ? t('loading') : t('selectTypePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {transactionTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              {t(`transactionType_${type.name}` as any, {defaultValue: type.name})}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.typeId && <p className="text-sm text-destructive">{t(errors.typeId.message as any) || errors.typeId.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="walletId">{t('wallet')}</Label>
                  <Controller
                    name="walletId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingWallets || wallets.length === 0}
                      >
                        <SelectTrigger id="walletId" className={errors.walletId ? 'border-destructive' : ''}>
                          <Landmark className="mr-2 h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder={isLoadingWallets ? t('loading') : t('selectWalletPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {wallets.map(wallet => (
                            <SelectItem key={wallet.id} value={String(wallet.id)}>
                              {wallet.name} (<CurrencyDisplay amountInCents={wallet.amount.amount} currencyCode={wallet.amount.currency.code} />)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.walletId && <p className="text-sm text-destructive">{t(errors.walletId.message as any) || errors.walletId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryId">{t('category')}</Label>
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                        value={field.value || "none"}
                        disabled={isLoadingCategories || mainCategoriesHierarchical.length === 0}
                      >
                        <SelectTrigger id="categoryId" className={errors.categoryId ? 'border-destructive' : ''}>
                          <Shapes className="mr-2 h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder={isLoadingCategories ? t('loading') : t('selectCategoryOptionalPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent className="max-h-72 overflow-y-auto">
                           <SelectItem value="none">{t('noCategoryOption')}</SelectItem>
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
                  {errors.categoryId && <p className="text-sm text-destructive">{t(errors.categoryId.message as any) || errors.categoryId.message}</p>}
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
                {errors.description && <p className="text-sm text-destructive">{t(errors.description.message as any) || errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
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
                            {field.value ? format(field.value, "PPP", { locale: dateFnsLocale }) : <span>{t('selectDate')}</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            initialFocus
                            locale={dateFnsLocale} 
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  {errors.date && <p className="text-sm text-destructive">{t(errors.date.message as any) || errors.date.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequencyId">{t('frequency')}</Label>
                  <Controller
                    name="frequencyId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingFrequencies || frequencies.length === 0}
                      >
                        <SelectTrigger id="frequencyId" className={errors.frequencyId ? 'border-destructive' : ''}>
                          <Repeat className="mr-2 h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder={isLoadingFrequencies ? t('loading') : t('selectFrequencyPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencies.map(freq => {
                            const suffix = FREQUENCY_NAME_TO_TRANSLATION_SUFFIX[freq.name.toUpperCase()];
                            const translationKey = suffix ? `frequency_${suffix}` : freq.name.toLowerCase().replace(/\s+/g, '_');
                            return (
                                <SelectItem key={freq.id} value={freq.id}>
                                {t(translationKey as any, {defaultValue: freq.name})}
                                </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.frequencyId && <p className="text-sm text-destructive">{t(errors.frequencyId.message as any) || errors.frequencyId.message}</p>}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmittingForm || anyDataLoading}>
                  {isSubmittingForm ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {isSubmittingForm ? t('saving') : t('updateTransactionButton')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
    