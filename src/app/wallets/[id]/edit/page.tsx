
"use client";

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { getWalletById, updateWallet, getWalletTypes, getWalletsList, getCurrencies } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import type { UpdateWalletPayload, WalletDetails, WalletTypeMap, CurrenciesApiResponse, CurrencyInfo } from '@/types';
import { Save, ArrowLeft, Loader2, Coins, AlertTriangle } from 'lucide-react';

const currencyCodeRegex = /^[A-Z]{3}$/;
const MOST_USEFUL_CURRENCY_CODES = ['USD', 'EUR', 'GBP', 'PLN', 'UAH', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];

const createEditWalletFormSchema = (t: Function) => z.object({
  name: z.string().min(1, { message: t('walletNameRequired') }).max(50, { message: t('walletNameTooLong') }),
  balance: z.coerce.number().min(0, { message: t('balanceCannotBeNegative') }), // balance, not initialBalance
  currency: z.string().regex(currencyCodeRegex, { message: t('invalidCurrencyCode') }).min(3, { message: t('currencyRequired') }).max(3),
  type: z.string().min(1, { message: t('walletTypeRequired') }),
});

type EditWalletFormData = z.infer<ReturnType<typeof createEditWalletFormSchema>>;

export default function EditWalletPage() {
  const { token, isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [walletToEdit, setWalletToEdit] = useState<WalletDetails | null>(null);
  const [allWallets, setAllWallets] = useState<WalletDetails[]>([]);
  const [walletTypes, setWalletTypes] = useState<WalletTypeMap>({});
  const [allCurrencies, setAllCurrencies] = useState<CurrencyInfo[]>([]);
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [formIsSubmitting, setFormIsSubmitting] = useState(false); // Renamed for clarity
  const [errorOccurred, setErrorOccurred] = useState(false);

  const EditWalletFormSchema = createEditWalletFormSchema(t);

  const { control, handleSubmit, register, formState: { errors }, reset, setValue } = useForm<EditWalletFormData>({
    resolver: zodResolver(EditWalletFormSchema),
    defaultValues: {
      name: '',
      balance: 0,
      currency: '',
      type: '',
    },
  });

  const fetchRequiredData = useCallback(async () => {
    if (!id || !token || !isAuthenticated) {
        setIsLoadingData(false);
        setErrorOccurred(true);
        return;
    }
    setIsLoadingData(true);
    setErrorOccurred(false);
    try {
      const [fetchedWallet, typesData, existingWalletsData, currenciesData] = await Promise.all([
        getWalletById(id, token),
        getWalletTypes(token),
        getWalletsList(token),
        getCurrencies(token),
      ]);
      
      setWalletToEdit(fetchedWallet);
      setWalletTypes(typesData.types || {});
      setAllWallets(existingWalletsData.wallets || []);
      
      const formattedCurrencies = Object.entries(currenciesData.currencies).map(([nameKey, code]) => ({
        code,
        nameKey,
        displayName: `${code} - ${t(`currency_${nameKey}`, { defaultValue: nameKey.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') })}`,
      }));
      setAllCurrencies(formattedCurrencies);

      reset({
        name: fetchedWallet.name,
        balance: fetchedWallet.amount.amount / 100, // Convert cents to units
        currency: fetchedWallet.currency.code,
        type: fetchedWallet.type,
      });

    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorFetchingWalletData'), description: error.message });
      setErrorOccurred(true);
    } finally {
      setIsLoadingData(false);
    }
  }, [id, token, isAuthenticated, reset, toast, t]);

  useEffect(() => {
    fetchRequiredData();
  }, [fetchRequiredData]);


  const { mostUsefulCurrenciesList, otherCurrenciesList } = useMemo(() => {
    const useful = allCurrencies
      .filter(c => MOST_USEFUL_CURRENCY_CODES.includes(c.code))
      .sort((a, b) => MOST_USEFUL_CURRENCY_CODES.indexOf(a.code) - MOST_USEFUL_CURRENCY_CODES.indexOf(b.code));

    const others = allCurrencies
      .filter(c => !MOST_USEFUL_CURRENCY_CODES.includes(c.code))
      .sort((a, b) => (a.displayName || a.code).localeCompare(b.displayName || b.code));

    return { mostUsefulCurrenciesList: useful, otherCurrenciesList: others };
  }, [allCurrencies]);


  const onSubmit: SubmitHandler<EditWalletFormData> = async (data) => {
    if (!token || !id || !walletToEdit) return;

    // Check for "main" wallet conflict
    if (data.type === 'main') {
      const otherMainWalletExists = allWallets.some(
        wallet => wallet.type === 'main' && String(wallet.id) !== String(id)
      );
      if (otherMainWalletExists) {
        toast({
          variant: "destructive",
          title: t('errorUpdatingWallet'),
          description: t('mainWalletExistsError'),
        });
        return;
      }
    }

    setFormIsSubmitting(true);
    const payload: UpdateWalletPayload = {
      name: data.name,
      amount_cents: Math.round(data.balance * 100), // Convert units to cents
      currency: data.currency.toUpperCase(),
      type: data.type,
    };

    try {
      await updateWallet(id, payload, token);
      toast({ title: t('walletUpdateSuccessTitle'), description: t('walletUpdateSuccessDesc') });
      router.push('/wallets');
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorUpdatingWallet'), description: error.message });
    } finally {
      setFormIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (errorOccurred || !walletToEdit) {
     return (
      <MainLayout>
        <Card className="max-w-2xl mx-auto shadow-lg border-destructive">
          <CardHeader className="bg-destructive/10">
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" />
              {t('errorFetchingWalletData')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p>{t('couldNotLoadWalletEdit')}</p>
          </CardContent>
           <CardFooter className="flex justify-end">
            <Button variant="outline" onClick={() => router.push('/wallets')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backButton')}
            </Button>
          </CardFooter>
        </Card>
      </MainLayout>
    );
  }

  const hasMainWalletAlready = allWallets.some(w => w.type === 'main' && String(w.id) !== String(id));
  const isButtonDisabled = formIsSubmitting || isLoadingData;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-3xl font-bold text-foreground">{t('editWalletTitle')}</h1>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backButton')}
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('updateWalletDetails')}</CardTitle>
            <CardDescription>{t('modifyWalletFormBelow')}</CardDescription>
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
                        disabled={isLoadingData || Object.keys(walletTypes).length === 0}
                      >
                        <SelectTrigger id="type" className={errors.type ? 'border-destructive' : ''}>
                          <SelectValue placeholder={isLoadingData ? t('loading') : t('selectWalletTypePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(walletTypes).map(([key, value]) => (
                            <SelectItem
                              key={key}
                              value={key}
                              disabled={key === 'main' && hasMainWalletAlready}
                            >
                              {t(`walletType_${value}` as any, { defaultValue: value })}
                              {key === 'main' && hasMainWalletAlready && ` (${t('mainWalletExistsErrorShort')})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="balance">{t('balanceLabel')}</Label>
                  <Input id="balance" type="number" step="0.01" {...register('balance')} placeholder="0.00" className={errors.balance ? 'border-destructive' : ''} />
                  {errors.balance && <p className="text-sm text-destructive">{errors.balance.message}</p>}
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
                        disabled={isLoadingData || allCurrencies.length === 0}
                      >
                        <SelectTrigger id="currency" className={errors.currency ? 'border-destructive' : ''}>
                          <Coins className="mr-2 h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder={isLoadingData ? t('loading') : t('selectCurrencyPlaceholder')} />
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
                          {mostUsefulCurrenciesList.length > 0 && otherCurrenciesList.length > 0 && <SelectSeparator />}
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
                <Button type="submit" disabled={isButtonDisabled}>
                  {isButtonDisabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isButtonDisabled ? t('saving') : t('saveWalletChangesButton')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
