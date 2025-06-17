
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { createWallet, getWalletTypes, getWalletsList, getCurrencies } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import type { CreateWalletPayload, WalletTypeMap, WalletDetails, CurrenciesApiResponse, CurrencyInfo } from '@/types';
import { Save, ArrowLeft, Loader2, Coins } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const currencyCodeRegex = /^[A-Z]{3}$/;
const MOST_USEFUL_CURRENCY_CODES = ['USD', 'EUR', 'GBP', 'PLN', 'UAH', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];

const createWalletFormSchema = (t: Function) => z.object({
  name: z.string().min(1, { message: t('walletNameRequired') }).max(50, { message: t('walletNameTooLong') }),
  initialBalance: z.coerce.number().optional().nullable(), 
  currency: z.string().regex(currencyCodeRegex, { message: t('invalidCurrencyCode') }).min(3, { message: t('currencyRequired') }).max(3),
  type: z.string().min(1, { message: t('walletTypeRequired') }),
});

type WalletFormData = z.infer<ReturnType<typeof createWalletFormSchema>>;

export default function NewWalletPage() {
  const { token, isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();

  const [walletTypes, setWalletTypes] = useState<WalletTypeMap>({});
  const [existingWallets, setExistingWallets] = useState<WalletDetails[]>([]);
  const [allCurrencies, setAllCurrencies] = useState<CurrencyInfo[]>([]);

  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [isLoadingExistingWallets, setIsLoadingExistingWallets] = useState(true);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(true);
  const [hasMainWallet, setHasMainWallet] = useState(false);

  const WalletFormSchema = createWalletFormSchema(t);

  const { control, handleSubmit, register, formState: { errors, isSubmitting }, setValue } = useForm<WalletFormData>({
    resolver: zodResolver(WalletFormSchema),
    defaultValues: {
      name: '',
      initialBalance: null,
      currency: user?.userCurrency?.code || '',
      type: '',
    },
  });

  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoadingTypes(true);
      getWalletTypes(token)
        .then(data => setWalletTypes(data.types || {}))
        .catch(error => toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message }))
        .finally(() => setIsLoadingTypes(false));

      setIsLoadingExistingWallets(true);
      getWalletsList(token)
        .then(data => {
          const currentWallets = data.wallets || [];
          setExistingWallets(currentWallets);
          setHasMainWallet(currentWallets.some(wallet => wallet.type === 'main'));
        })
        .catch(error => toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message }))
        .finally(() => setIsLoadingExistingWallets(false));
      
      setIsLoadingCurrencies(true);
      getCurrencies(token)
        .then((data: CurrenciesApiResponse) => {
          const formattedCurrencies = Object.entries(data.currencies).map(([nameKey, code]) => ({
            code,
            nameKey,
            displayName: `${code} - ${nameKey.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`,
          }));
          setAllCurrencies(formattedCurrencies);
        })
        .catch(error => toast({ variant: "destructive", title: t('errorFetchingCurrencies'), description: error.message}))
        .finally(() => setIsLoadingCurrencies(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated, t, toast]);
  
  useEffect(() => {
    if (user?.userCurrency?.code) {
      setValue('currency', user.userCurrency.code);
    }
  }, [user, setValue]);

  const { mostUsefulCurrenciesList, otherCurrenciesList } = useMemo(() => {
    const useful = allCurrencies
      .filter(c => MOST_USEFUL_CURRENCY_CODES.includes(c.code))
      .sort((a, b) => MOST_USEFUL_CURRENCY_CODES.indexOf(a.code) - MOST_USEFUL_CURRENCY_CODES.indexOf(b.code));
    
    const others = allCurrencies
      .filter(c => !MOST_USEFUL_CURRENCY_CODES.includes(c.code))
      .sort((a, b) => (a.displayName || a.code).localeCompare(b.displayName || b.code));
      
    return { mostUsefulCurrenciesList: useful, otherCurrenciesList: others };
  }, [allCurrencies]);

  const onSubmit: SubmitHandler<WalletFormData> = async (data) => {
    if (!token) return;

    if (data.type === 'main' && hasMainWallet) {
        toast({
            variant: "destructive",
            title: t('errorCreatingWallet'),
            description: t('mainWalletExistsError'),
        });
        return;
    }

    const payload: CreateWalletPayload = {
      name: data.name,
      amount_cents: data.initialBalance ? Math.round(data.initialBalance * 100) : 0,
      currency: data.currency.toUpperCase(),
      type: data.type,
    };

    try {
      await createWallet(payload, token);
      toast({ title: t('walletCreatedTitle'), description: t('walletCreatedDesc') });
      router.push('/wallets');
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorCreatingWallet'), description: error.message });
    }
  };
  
  const anyDataLoading = isLoadingTypes || isLoadingExistingWallets || isLoadingCurrencies;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-3xl font-bold text-foreground">{t('newWalletTitle')}</h1>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backButton')}
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('enterWalletDetails')}</CardTitle>
            <CardDescription>{t('fillWalletFormBelow')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('walletNameLabel')}</Label>
                  <Input id="name" {...register('name')} placeholder={t('walletNamePlaceholder')} className={errors.name ? 'border-destructive' : ''} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">{t('walletTypeLabel')}</Label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value} 
                        disabled={isLoadingTypes || Object.keys(walletTypes).length === 0}
                      >
                        <SelectTrigger id="type" className={errors.type ? 'border-destructive' : ''}>
                          <SelectValue placeholder={isLoadingTypes ? t('loading') : t('selectWalletTypePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(walletTypes).map(([key, value]) => (
                            <SelectItem 
                              key={key} 
                              value={key}
                              disabled={key === 'main' && hasMainWallet}
                            >
                              {t(`walletType_${value}` as any, { defaultValue: value })}
                              {key === 'main' && hasMainWallet && ` (${t('mainWalletExistsErrorShort')})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
                  {hasMainWallet && (
                     <Alert variant="default" className="mt-2">
                        <AlertDescription>
                          {t('mainWalletInfo')}
                        </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="initialBalance">{t('initialBalanceLabel')}</Label>
                  <Input id="initialBalance" type="number" step="0.01" {...register('initialBalance')} placeholder={t('initialBalancePlaceholder')} className={errors.initialBalance ? 'border-destructive' : ''} />
                  {errors.initialBalance && <p className="text-sm text-destructive">{errors.initialBalance.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">{t('currencyLabel')}</Label>
                   <Controller
                    name="currency"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingCurrencies || allCurrencies.length === 0}
                      >
                        <SelectTrigger id="currency" className={errors.currency ? 'border-destructive' : ''}>
                          <Coins className="mr-2 h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder={isLoadingCurrencies ? t('loading') : t('selectCurrencyPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {mostUsefulCurrenciesList.length > 0 && (
                            <SelectGroup>
                              <SelectLabel>{t('mostCommonCurrenciesLabel')}</SelectLabel>
                              {mostUsefulCurrenciesList.map(curr => (
                                <SelectItem key={curr.code} value={curr.code}>{curr.displayName}</SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                          {otherCurrenciesList.length > 0 && (
                            <SelectGroup>
                              <SelectLabel>{t('allCurrenciesLabel')}</SelectLabel>
                              {otherCurrenciesList.map(curr => (
                                <SelectItem key={curr.code} value={curr.code}>{curr.displayName}</SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.currency && <p className="text-sm text-destructive">{errors.currency.message}</p>}
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting || anyDataLoading}>
                  {isSubmitting || anyDataLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmitting || anyDataLoading ? t('saving') : t('saveWalletButton')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
