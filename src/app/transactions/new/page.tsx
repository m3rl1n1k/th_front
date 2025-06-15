
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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { 
  getTransactionTypes, 
  createTransaction,
  getTransactionFrequencies,
  getWalletsList,
  getTransactionCategories
} from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import type { TransactionType as AppTransactionType, Frequency, Wallet, Category } from '@/types';
import { CalendarIcon, Save, ArrowLeft, Repeat, Landmark, Shapes, Loader2 } from 'lucide-react';
import { useGlobalLoader } from '@/context/global-loader-context';

export default function NewTransactionPage() {
  const { token, isAuthenticated, user } = useAuth(); // Added user here
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  
  const [transactionTypes, setTransactionTypes] = useState<AppTransactionType[]>([]);
  const [frequencies, setFrequencies] = useState<Frequency[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [isLoadingFrequencies, setIsLoadingFrequencies] = useState(false); // Only load if recurring
  const [isLoadingWallets, setIsLoadingWallets] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  const { setIsLoading: setGlobalLoading } = useGlobalLoader();

  const NewTransactionSchema = z.object({
    amount: z.coerce.number().positive({ message: t('amountPositiveError') }),
    description: z.string().max(255, { message: t('descriptionTooLongError')}).optional().nullable(),
    typeId: z.string().min(1, { message: t('typeRequired') }),
    date: z.date({ required_error: t('dateRequired') }),
    isRecurring: z.boolean(),
    walletId: z.string().min(1, { message: t('walletRequiredError') }),
    categoryId: z.string().min(1, { message: t('categoryRequiredError') }),
    frequencyId: z.string().optional(), // Optional, only relevant if isRecurring
  });

  type NewTransactionFormData = z.infer<typeof NewTransactionSchema>;

  const { control, handleSubmit, formState: { errors, isSubmitting }, register, watch } = useForm<NewTransactionFormData>({
    resolver: zodResolver(NewTransactionSchema),
    defaultValues: {
      amount: undefined,
      description: '',
      typeId: '', 
      date: new Date(),
      isRecurring: false,
      walletId: '',
      categoryId: '',
      frequencyId: '',
    },
  });

  const isRecurringWatched = watch('isRecurring');

  useEffect(() => {
    const overallLoading = isLoadingTypes || isLoadingWallets || isLoadingCategories || (isRecurringWatched && isLoadingFrequencies);
    setGlobalLoading(overallLoading);
  }, [isLoadingTypes, isLoadingWallets, isLoadingCategories, isLoadingFrequencies, isRecurringWatched, setGlobalLoading]);

  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoadingTypes(true);
      getTransactionTypes(token)
        .then(data => {
          const formattedTypes = Object.entries(data.types)
            .map(([id, name]) => ({ id, name: name as string }));
          setTransactionTypes(formattedTypes);
        })
        .catch(error => {
          console.error("Failed to fetch transaction types", error);
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
        })
        .finally(() => setIsLoadingTypes(false));

      setIsLoadingWallets(true);
      getWalletsList(token)
        .then(data => {
           const formattedWallets = data.wallets.map(w => ({ id: String(w.id), name: w.name}));
           setWallets(formattedWallets);
        })
        .catch(error => {
          console.error("Failed to fetch wallets", error);
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
        })
        .finally(() => setIsLoadingWallets(false));
      
      setIsLoadingCategories(true);
      getTransactionCategories(token) // This uses mock data for now
        .then(data => {
          const formattedCategories = Object.entries(data.categories)
            .map(([id, name]) => ({ id, name: name as string }));
          setCategories(formattedCategories);
        })
        .catch(error => {
          console.error("Failed to fetch categories", error);
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
        })
        .finally(() => setIsLoadingCategories(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated, t, toast]);

  useEffect(() => {
    if (isRecurringWatched && isAuthenticated && token) {
      setIsLoadingFrequencies(true);
      getTransactionFrequencies(token)
        .then(data => {
          const formattedFrequencies = Object.entries(data.periods)
            .map(([id, name]) => ({ id, name: name as string }));
          setFrequencies(formattedFrequencies);
        })
        .catch(error => {
          console.error("Failed to fetch frequencies", error);
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
        })
        .finally(() => setIsLoadingFrequencies(false));
    } else {
      setFrequencies([]); // Clear frequencies if not recurring
      setIsLoadingFrequencies(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecurringWatched, token, isAuthenticated, t, toast]);


  const onSubmit: SubmitHandler<NewTransactionFormData> = async (data) => {
    if (!token) {
      toast({ variant: "destructive", title: t('error'), description: t('tokenMissingError') });
      return;
    }
    setGlobalLoading(true);
    try {
      // API expects amount in cents
      // API expects typeId as a string e.g. "2" for EXPENSE
      const payload = {
        amount: Math.round(data.amount * 100), 
        description: data.description || null,
        typeId: data.typeId, 
        date: format(data.date, 'yyyy-MM-dd'),
        isRecurring: data.isRecurring,
        wallet_id: parseInt(data.walletId), // API_DOCUMENTATION expects wallet_id, potentially numeric
        category_id: parseInt(data.categoryId), // API_DOCUMENTATION expects category_id, potentially numeric
        // frequencyId is not sent as per API spec, only isRecurring affects backend logic
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
      // Global loader is turned off by navigation events or the effect watching local loaders
      // setGlobalLoading(false); // This line might be redundant if navigation events handle it
    }
  };
  
  const anyDataLoading = isLoadingTypes || isLoadingWallets || isLoadingCategories || (isRecurringWatched && isLoadingFrequencies);

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
                    placeholder={t('amountPlaceholder', { currency: user?.userCurrency?.code || '$' })} 
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
                  <Label htmlFor="walletId">{t('wallet')}</Label>
                  <Controller
                    name="walletId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoadingWallets || wallets.length === 0}
                      >
                        <SelectTrigger id="walletId" className={errors.walletId ? 'border-destructive' : ''}>
                           <Landmark className="mr-2 h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder={isLoadingWallets ? t('loading') : t('selectWalletPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {wallets.map(wallet => (
                            <SelectItem key={wallet.id} value={String(wallet.id)}>
                              {wallet.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.walletId && <p className="text-sm text-destructive">{errors.walletId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryId">{t('category')}</Label>
                  <Controller
                    name="categoryId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoadingCategories || categories.length === 0}
                      >
                        <SelectTrigger id="categoryId" className={errors.categoryId ? 'border-destructive' : ''}>
                          <Shapes className="mr-2 h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder={isLoadingCategories ? t('loading') : t('selectCategoryPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
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

                <div className="space-y-4">
                    <div className="flex items-center space-x-2 pt-2">
                       <Controller
                        name="isRecurring"
                        control={control}
                        render={({ field }) => (
                           <Checkbox
                            id="isRecurring"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-5 w-5"
                          />
                        )}
                      />
                      <Label htmlFor="isRecurring" className="cursor-pointer font-medium text-sm">
                        {t('recurringTransaction')}
                      </Label>
                    </div>
                    {errors.isRecurring && <p className="text-sm text-destructive">{errors.isRecurring.message}</p>}

                    {isRecurringWatched && (
                        <div className="space-y-2 pl-2">
                            <Label htmlFor="frequencyId">{t('frequency')}</Label>
                            <Controller
                                name="frequencyId"
                                control={control}
                                rules={{ required: isRecurringWatched ? t('frequencyRequiredError') : false }}
                                render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isLoadingFrequencies || frequencies.length === 0}
                                >
                                    <SelectTrigger id="frequencyId" className={errors.frequencyId ? 'border-destructive' : ''}>
                                    <Repeat className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder={isLoadingFrequencies ? t('loading') : t('selectFrequencyPlaceholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {frequencies.map(freq => (
                                        <SelectItem key={freq.id} value={freq.id}>
                                        {freq.name} 
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                )}
                            />
                            {errors.frequencyId && <p className="text-sm text-destructive">{errors.frequencyId.message}</p>}
                        </div>
                    )}
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting || anyDataLoading}>
                  {isSubmitting || anyDataLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {isSubmitting || anyDataLoading ? t('saving') : t('saveTransaction')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

