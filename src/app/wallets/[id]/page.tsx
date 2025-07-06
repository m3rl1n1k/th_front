
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { getWalletById, getWalletTypes } from '@/lib/api';
import type { WalletDetails, WalletTypeMap, WalletTypeApiResponse } from '@/types';
import { ArrowLeft, Edit3, Loader2, AlertTriangle, Info, Landmark, CreditCard, WalletCards as WalletIcon, PiggyBank, Archive, ShieldCheck, HelpCircle } from 'lucide-react';

export default function ViewWalletPage() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation(); 
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [wallet, setWallet] = useState<WalletDetails | null>(null);
  const [walletTypeMap, setWalletTypeMap] = useState<WalletTypeMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletDetails = useCallback(async () => {
    if (!id || !token) {
      setIsLoading(false);
      if (!token) setError(t('tokenMissingError'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [walletData, typesDataResponse] = await Promise.all([
        getWalletById(id, token),
        getWalletTypes(token)
      ]);
      
      setWallet(walletData);
      setWalletTypeMap(typesDataResponse.types || {});

    } catch (err: any) {
      setError(err.message || t('errorFetchingData'));
      toast({ variant: "destructive", title: t('errorFetchingData'), description: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [id, token, t, toast]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWalletDetails();
    } else if (!isAuthenticated && !token) {
        setIsLoading(false);
    }
  }, [isAuthenticated, token, fetchWalletDetails]);

  const getTranslatedWalletType = (typeKey: string): string => {
    const mappedDisplayValue = walletTypeMap[typeKey];
    const typeIdentifierForTranslation = mappedDisplayValue || typeKey.toUpperCase();
    const userFriendlyDefault = mappedDisplayValue || typeKey;
    return t(`walletType_${typeIdentifierForTranslation}` as any, { defaultValue: userFriendlyDefault });
  };
  
  const getWalletVisualIcon = (walletDetails: WalletDetails | null) => {
    if (!walletDetails) return <HelpCircle className="h-8 w-8 text-muted-foreground" />;
    const typeKey = walletDetails.type;
    const iconClass = "h-8 w-8";
    
    switch (typeKey) {
      case 'main': return <Landmark className={`${iconClass} text-blue-500`} />;
      case 'deposit': return <PiggyBank className={`${iconClass} text-green-500`} />;
      case 'cash': return <WalletIcon className={`${iconClass} text-yellow-600`} />;
      case 'credit': return <CreditCard className={`${iconClass} text-purple-500`} />;
      case 'archive': return <Archive className={`${iconClass} text-gray-500`} />;
      case 'block': return <ShieldCheck className={`${iconClass} text-red-500`} />;
      default: return <HelpCircle className={`${iconClass} text-muted-foreground`} />;
    }
  };


  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-full py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Card className="max-w-2xl mx-auto shadow-lg border-destructive">
          <CardHeader className="bg-destructive/10">
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-6 w-6" />
              {t('errorFetchingData')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p>{error}</p>
          </CardContent>
          <div className="flex justify-end p-4">
            <Button variant="outline" onClick={() => router.push('/wallets')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backButton')}
            </Button>
          </div>
        </Card>
      </MainLayout>
    );
  }

  if (!wallet) {
    return (
      <MainLayout>
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle>{t('walletNotFoundTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p>{t('walletNotFoundDesc')}</p>
          </CardContent>
          <div className="flex justify-end p-4">
            <Button variant="outline" onClick={() => router.push('/wallets')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backButton')}
            </Button>
          </div>
        </Card>
      </MainLayout>
    );
  }
  
  const detailItems = [
    { labelKey: 'walletIdLabel', value: String(wallet.id), icon: <Info className="text-primary" /> },
    { labelKey: 'nameLabel', value: wallet.name, icon: <Info className="text-primary" /> },
    { labelKey: 'walletTypeLabel', value: getTranslatedWalletType(wallet.type), icon: <Info className="text-primary" /> },
    { labelKey: 'balanceLabel', value: <CurrencyDisplay amountInCents={wallet.amount.amount} currencyCode={wallet.currency.code} />, icon: <Landmark className="text-primary" /> },
    { labelKey: 'accountNumberLabel', value: wallet.number || t('notSet'), icon: <CreditCard className="text-primary" /> },
    { labelKey: 'currencyLabel', value: wallet.currency.code, icon: <WalletIcon className="text-primary" /> },
  ];

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="font-headline text-3xl font-bold text-foreground">
                {t('walletDetailsTitle')}
            </h1>
        </div>

        <Card className="shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/30 dark:bg-muted/10 border-b p-6 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-2xl font-semibold">{wallet.name}</CardTitle>
                    <CardDescription>{getTranslatedWalletType(wallet.type)}</CardDescription>
                </div>
                {getWalletVisualIcon(wallet)}
            </CardHeader>
            <CardContent className="p-6 space-y-5">
                {detailItems.filter(item => item.labelKey !== 'nameLabel' && item.labelKey !== 'walletTypeLabel').map(item => (
                    <div key={item.labelKey} className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1 text-primary">
                            {React.cloneElement(item.icon, { className: "h-5 w-5" })}
                        </div>
                        <div className="flex-grow">
                            <p className="text-sm font-medium text-muted-foreground">{t(item.labelKey as any)}</p>
                            <p className="text-lg text-foreground break-words">
                                {item.value}
                            </p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => router.push('/wallets')} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('backToListButton')}
            </Button>
            <Button asChild variant="default" className="w-full sm:w-auto">
                <Link href={`/wallets/${wallet.id}/edit`}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    {t('editWalletButton')}
                </Link>
            </Button>
        </div>
      </div>
    </MainLayout>
  );
}
