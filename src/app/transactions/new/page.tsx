
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import Link from 'next/link';

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
  getTransactionTypes,
  createTransaction,
  getTransactionFrequencies,
  getWalletsList,
  getMainCategories
} from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import type { TransactionType as AppTransactionType, Frequency, WalletDetails, MainCategory as ApiMainCategory, ApiError } from '@/types';
import { CalendarIcon, Save, ArrowLeft, Repeat, Landmark, Shapes, Loader2, Calculator, PlusCircle } from 'lucide-react';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { SimpleAmountCalculator } from '@/components/common/simple-amount-calculator';

const generateCategoryTranslationKey = (name: string | undefined | null): string => {
  if (!name) return '';
  return name.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

export default function NewTransactionPage() {
  const { token, isAuthenticated, user, promptSessionRenewal } = useAuth();
  const { t, dateFnsLocale } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();

  const [transactionTypes, setTransactionTypes] = useState<AppTransactionType[]>([]);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [wallets, setWallets] = useState<WalletDetails[]>([]);
  const [mainCategoriesHierarchical, setMainCategoriesHierarchical] = useState<ApiMainCategory[]>([]);

  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [isLoadingFrequencies, setIsLoadingFrequencies] = useState(true);
  const [isLoadingWallets, setIsLoadingWallets] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  const NewTransactionSchema = z.object({
    amount: z.coerce.number().positive({ message: t('amountPositiveError') }),
    description: z.string().max(255, { message: t('descriptionTooLongError')}).optional().nullable(),
    typeId: z.string().min(1, { message: t('typeRequired') }),
    date: z.date({ required_error: t('dateRequired') }),
    walletId: z.string().min(1, { message: t('walletRequiredError') }),
    categoryId: z.string().optional().nullable(),
    frequencyId: z.string().min(1, { message: t('frequencyRequiredError')}),
  });

  type NewTransactionFormData = z.infer<typeof NewTransactionSchema>;

  const { control, handleSubmit, formState: { errors, isSubmitting: formIsSubmitting }, register, reset, getValues, setValue } = useForm<NewTransactionFormData>({
    resolver: zodResolver(NewTransactionSchema),
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
        .then(data => {
          const formattedTypes = Object.entries(data.types)
            .map(([id, name]) => ({ id, name: name as string }))
            .filter(type => type.name.toUpperCase() !== 'TRANSFER');
          setTransactionTypes(formattedTypes);
        })
        .catch(error => {
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
        })
        .finally(() => setIsLoadingTypes(false));

      setIsLoadingWallets(true);
      getWalletsList(token)
        .then(data => {
           setWallets(data.wallets || []);
        })
        .catch(error => {
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
        })
        .finally(() => setIsLoadingWallets(false));

      setIsLoadingCategories(true);
      getMainCategories(token)
        .then(mainCategoriesResponse => {
          setMainCategoriesHierarchical(Array.isArray(mainCategoriesResponse) ? mainCategoriesResponse : []);
        })
        .catch(error => {
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
          setMainCategoriesHierarchical([]);
        })
        .finally(() => setIsLoadingCategories(false));

      setIsLoadingFrequencies(true);
      getTransactionFrequencies(token)
        .then(data => {
          const formattedFrequencies = Object.entries(data.periods)
            .map(([id, name]) => ({ id, name: name as string }));
          setFrequencies(formattedFrequencies);
        })
        .catch(error => {
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
        })
        .finally(() => setIsLoadingFrequencies(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated, t, toast]);

  useEffect(() => {
    if (isLoadingWallets || isLoadingTypes || isLoadingFrequencies) {
      return; 
    }

    const currentFormValues = getValues(); 
    const newDefaultsToSet: Partial<NewTransactionFormData> = {};
    let RHF_stateUpdated = false;

    if (!currentFormValues.walletId && wallets.length > 0) {
      const defaultWallet = wallets.find(w => w.type?.toLowerCase() === 'main') || wallets[0];
      if (defaultWallet) {
        newDefaultsToSet.walletId = String(defaultWallet.id);
        RHF_stateUpdated = true;
      }
    }

    if (!currentFormValues.typeId && transactionTypes.length > 0) {
      const defaultExpenseType = transactionTypes.find(t => t.name.toUpperCase() === 'EXPENSE') || transactionTypes[0];
      if (defaultExpenseType) {
        newDefaultsToSet.typeId = defaultExpenseType.id;
        RHF_stateUpdated = true;
      }
    }
    
    if (!currentFormValues.frequencyId && frequencies.length > 0) {
      const defaultOneTimeFrequency = frequencies.find(f => f.id === "0") || frequencies.find(f => f.name.toUpperCase() === 'ONE_TIME');
      if (defaultOneTimeFrequency) {
        newDefaultsToSet.frequencyId = defaultOneTimeFrequency.id;
        RHF_stateUpdated = true;
      } else if (frequencies.length > 0) {
      }
    }

    if (RHF_stateUpdated && Object.keys(newDefaultsToSet).length > 0) {
      reset(prev => ({
        ...prev,
        ...newDefaultsToSet,
      }));
    }
  }, [
    isLoadingWallets, isLoadingTypes, isLoadingFrequencies,
    wallets, transactionTypes, frequencies,
    reset, getValues
  ]);


  const onSubmit: SubmitHandler<NewTransactionFormData> = async (data) => {
    if (!token) {
      toast({ variant: "destructive", title: t('error'), description: t('tokenMissingError') });
      return;
    }

    try {
      const payload = {
        amount: Math.round(data.amount * 100),
        description: data.description || null,
        typeId: data.typeId,
        date: format(data.date, 'yyyy-MM-dd'),
        wallet_id: parseInt(data.walletId),
        category_id: data.categoryId ? parseInt(data.categoryId) : null,
        frequencyId: data.frequencyId,
      };
      await createTransaction(payload, token);
      toast({
        title: t('transactionSavedTitle'),
        description: t('transactionSavedDesc'),
      });
      router.push('/transactions');
    } catch (error: any) {
      if ((error as ApiError).code === 401) { promptSessionRenewal(); return; }
      toast({
        variant: "destructive",
        title: t('transactionFailedTitle'),
        description: error.message || t('unexpectedError'),
      });
    }
  };

  const anyDataLoading = isLoadingTypes || isLoadingWallets || isLoadingCategories || isLoadingFrequencies;
  const isSubmitting = formIsSubmitting || anyDataLoading;

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
                  <div className="flex items-center gap-2">
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      {...register('amount')}
                      placeholder={t('amountPlaceholder', { currency: user?.userCurrency?.code || '$' })}
                      className={errors.amount ? 'border-destructive flex-grow' : 'flex-grow'}
                    />
                    <Popover open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" type="button" aria-label={t('calculator.open')}>
                          <Calculator className="h-5 w-5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-0 shadow-none bg-transparent" align="end">
                        <SimpleAmountCalculator
                          initialValue={getValues('amount')}
                          onApply={(val) => {
                            setValue('amount', val, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                            setIsCalculatorOpen(false);
                          }}
                          onClose={() => setIsCalculatorOpen(false)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
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
                        value={field.value}
                        disabled={isLoadingTypes || transactionTypes.length === 0}
                      >
                        <SelectTrigger id="typeId" className={errors.typeId ? 'border-destructive' : ''}>
                          <SelectValue placeholder={isLoadingTypes ? t('loading') : t('selectTypePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {transactionTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              {t(`transactionType_${type.name}` as keyof ReturnType<typeof useTranslation>['translations'], {defaultValue: type.name})}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.typeId && <p className="text-sm text-destructive">{errors.typeId.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="walletId">{t('wallet')}</Label>
                    <Button asChild variant="outline" size="sm" className="text-xs px-2 py-1 h-auto">
                      <Link href="/wallets/new">
                        <PlusCircle className="mr-1 h-3 w-3" />
                        {t('createNewButton')}
                      </Link>
                    </Button>
                  </div>
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
                  {errors.walletId && <p className="text-sm text-destructive">{errors.walletId.message}</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="categoryId">{t('category')}</Label>
                    <Button asChild variant="outline" size="sm" className="text-xs px-2 py-1 h-auto">
                      <Link href="/categories/new">
                        <PlusCircle className="mr-1 h-3 w-3" />
                        {t('createNewButton')}
                      </Link>
                    </Button>
                  </div>
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
                  {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId.message}</p>}
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
                  {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
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
                            {frequencies.map(freq => (
                                <SelectItem key={freq.id} value={freq.id}>
                                {t(`frequency_${freq.name}` as any, {defaultValue: freq.name})}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        )}
                    />
                    {errors.frequencyId && <p className="text-sm text-destructive">{errors.frequencyId.message}</p>}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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
