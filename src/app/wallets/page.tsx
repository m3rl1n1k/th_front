
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { getWalletsList, getWalletTypes } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { WalletCards, Landmark, AlertTriangle, PlusCircle, PiggyBank, CreditCard, RefreshCwIcon } from 'lucide-react';
import type { WalletDetails, WalletTypeMap, WalletTypeApiResponse } from '@/types';
import { useGlobalLoader } from '@/context/global-loader-context';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export default function WalletsPage() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [wallets, setWallets] = useState<WalletDetails[] | null>(null);
  const [walletTypeMap, setWalletTypeMap] = useState<WalletTypeMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const { setIsLoading: setGlobalLoading } = useGlobalLoader();

  useEffect(() => {
    setGlobalLoading(isLoading || isLoadingTypes);
  }, [isLoading, isLoadingTypes, setGlobalLoading]);

  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoadingTypes(true);
      getWalletTypes(token)
        .then((data: { types: WalletTypeApiResponse }) => {
          setWalletTypeMap(data.types || {});
        })
        .catch(error => {
          console.error("Failed to fetch wallet types", error);
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
        })
        .finally(() => setIsLoadingTypes(false));
    } else {
      setIsLoadingTypes(false);
    }
  }, [token, isAuthenticated, t, toast]);

  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoading(true);
      getWalletsList(token)
        .then(data => {
          setWallets(data.wallets || []);
        })
        .catch(error => {
          console.error("Failed to fetch wallets", error);
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
          setWallets([]); 
        })
        .finally(() => setIsLoading(false));
    } else if (!isAuthenticated) {
      setIsLoading(false);
      setWallets([]);
    }
  }, [token, isAuthenticated, t, toast]);

  const processedWallets = useMemo(() => {
    if (!wallets || Object.keys(walletTypeMap).length === 0) {
      return null; 
    }
    return wallets.map(wallet => {
      const typeKey = wallet.type; 
      const mappedDisplayValue = typeof typeKey === 'string' ? walletTypeMap[typeKey] : undefined; 

      const typeIdentifierForTranslation = mappedDisplayValue || (typeof typeKey === 'string' ? typeKey.toUpperCase() : 'UNKNOWN');
      
      const userFriendlyDefault = mappedDisplayValue || (typeof typeKey === 'string' ? typeKey : 'Unknown');

      return {
        ...wallet,
        typeName: t(`walletType_${typeIdentifierForTranslation}` as any, { defaultValue: userFriendlyDefault })
      };
    });
  }, [wallets, walletTypeMap, t]);

  const getWalletIcon = (typeFromWallet: string | null | undefined) => {
    const typeKey = typeof typeFromWallet === 'string' ? typeFromWallet : null;

    const mappedTypeEnum = typeKey ? walletTypeMap[typeKey] : undefined;

    let typeForSwitch: string;
    if (mappedTypeEnum) {
      typeForSwitch = mappedTypeEnum; 
    } else if (typeKey) {
      typeForSwitch = typeKey.toUpperCase(); 
    } else {
      typeForSwitch = 'UNKNOWN'; 
    }
    
    switch (typeForSwitch) {
      case 'MAIN':
        return <Landmark className="h-6 w-6 text-primary" />;
      case 'DEPOSIT':
        return <PiggyBank className="h-6 w-6 text-green-500" />;
      case 'CREDIT':
        return <CreditCard className="h-6 w-6 text-blue-500" />;
      case 'CASH':
         return <WalletCards className="h-6 w-6 text-yellow-500" />;
      case 'BLOCK': // Assuming 'BLOCK' is a valid type from walletTypeMap
         return <AlertTriangle className="h-6 w-6 text-red-500" />
      default:
        return <WalletCards className="h-6 w-6 text-muted-foreground" />;
    }
  };


  if (isLoading || isLoadingTypes) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="font-headline text-3xl font-bold text-foreground">{t('walletsTitle')}</h1>
             <Button disabled className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-5 w-5" />
              {t('addNewWalletButton')}
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-6 w-3/5" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-8 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (!processedWallets || processedWallets.length === 0) {
    return (
      <MainLayout>
        <div className="space-y-6">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="font-headline text-3xl font-bold text-foreground">{t('walletsTitle')}</h1>
             <Button className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-5 w-5" />
              {t('addNewWalletButton')}
            </Button>
          </div>
          <Card className="shadow-lg text-center py-12">
            <CardHeader>
              <WalletCards className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <CardTitle>{t('noWalletsFoundTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">{t('noWalletsFoundDescription')}</p>
              <Button>
                 <PlusCircle className="mr-2 h-5 w-5" />
                 {t('createFirstWalletButton')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }


  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-4xl font-bold text-foreground">{t('walletsTitle')}</h1>
          <Button className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
            <PlusCircle className="mr-2 h-5 w-5" />
            {t('addNewWalletButton')}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {processedWallets.map(wallet => (
            <Card key={wallet.id} className="shadow-xl hover:shadow-2xl transition-shadow duration-300 flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 bg-muted/20 rounded-t-lg p-4">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-semibold text-foreground">{wallet.name}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">{wallet.typeName}</CardDescription>
                </div>
                {getWalletIcon(wallet.type)}
              </CardHeader>
              <CardContent className="p-4 space-y-4 flex-grow">
                <div className="text-3xl font-bold text-primary">
                  <CurrencyDisplay amountInCents={wallet.amount.amount} currencyCode={wallet.amount.currency.code} />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground">{t('accountNumberLabel')}</p>
                    <p className="text-sm font-mono text-foreground break-all">{wallet.number || t('notSet')}</p>
                </div>
              </CardContent>
               <div className="p-4 border-t mt-auto">
                 <Button variant="outline" size="sm" className="w-full">{t('viewDetailsButton')}</Button>
               </div>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}

