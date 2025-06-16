
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { getWalletsList, getWalletTypes } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { WalletCards, Landmark, AlertTriangle, PlusCircle, PiggyBank, CreditCard, LayoutGrid, List } from 'lucide-react';
import type { WalletDetails, WalletTypeMap, WalletTypeApiResponse } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function WalletsPage() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [wallets, setWallets] = useState<WalletDetails[] | null>(null);
  const [walletTypeMap, setWalletTypeMap] = useState<WalletTypeMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoadingTypes(true);
      getWalletTypes(token)
        .then((data: { types: WalletTypeApiResponse }) => {
          setWalletTypeMap(data.types || {});
        })
        .catch(error => {
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
    if (!wallets || (Object.keys(walletTypeMap).length === 0 && wallets.length > 0)) {
      return null;
    }
    if (!wallets) return null;

    return wallets.map(wallet => {
      const typeKey = wallet.type;
      const mappedDisplayValue = typeof typeKey === 'string' ? walletTypeMap[typeKey] : undefined;
      let typeIdentifierForTranslation: string;

      if (mappedDisplayValue) {
        typeIdentifierForTranslation = mappedDisplayValue;
      } else if (typeKey) {
        typeIdentifierForTranslation = typeKey.toUpperCase();
      } else {
        typeIdentifierForTranslation = 'UNKNOWN';
      }
      
      const userFriendlyDefault = mappedDisplayValue || (typeof typeKey === 'string' ? typeKey : 'Unknown');
      
      const translationKey = `walletType_${typeIdentifierForTranslation}`;
      return {
        ...wallet,
        typeName: t(translationKey as any, { defaultValue: userFriendlyDefault })
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
      case 'BLOCK':
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
            <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-20 rounded-md" />
                <Button disabled className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  {t('addNewWalletButton')}
                </Button>
            </div>
          </div>
          <div className={`grid gap-6 ${viewMode === 'card' ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {viewMode === 'card' ? (
              [1, 2, 3, 4].map(i => (
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
              ))
            ) : (
              <Card className="shadow-lg">
                <CardHeader>
                  <Skeleton className="h-8 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center space-x-4 py-2 border-b last:border-b-0">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-5 w-1/4" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
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
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 border p-1 rounded-md bg-muted/50 dark:bg-muted/20">
              <Button
                variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('card')}
                title={t('viewAsCards')}
                aria-label={t('viewAsCards')}
              >
                <LayoutGrid className="h-5 w-5" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('table')}
                title={t('viewAsTable')}
                aria-label={t('viewAsTable')}
              >
                <List className="h-5 w-5" />
              </Button>
            </div>
            <Button className="shadow-md hover:shadow-lg transition-shadow">
              <PlusCircle className="mr-2 h-5 w-5" />
              {t('addNewWalletButton')}
            </Button>
          </div>
        </div>

        {viewMode === 'card' ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {processedWallets.map(wallet => (
              <Card key={wallet.id} className="shadow-xl hover:shadow-2xl transition-shadow duration-300 flex flex-col">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 bg-muted/20 dark:bg-muted/10 rounded-t-lg p-4">
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
                 <div className="p-4 border-t mt-auto bg-muted/10 dark:bg-muted/5 rounded-b-lg">
                   <Button variant="outline" size="sm" className="w-full">{t('viewDetailsButton')}</Button>
                 </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-xl border-border/60">
            <CardHeader className="border-b border-border/60">
              <CardTitle>{t('walletsListTableTitle')}</CardTitle>
              <CardDescription>{t('walletsListTableDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30 dark:bg-muted/10">
                    <TableRow>
                      <TableHead className="w-[50px] px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{null}</TableHead>
                      <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('nameLabel')}</TableHead>
                      <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('walletTypeLabel')}</TableHead>
                      <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('accountNumberLabel')}</TableHead>
                      <TableHead className="text-right px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('balanceLabel')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedWallets.map(wallet => (
                      <TableRow key={wallet.id} className="hover:bg-accent/10 dark:hover:bg-accent/5 transition-colors">
                        <TableCell className="px-4 py-3">{getWalletIcon(wallet.type)}</TableCell>
                        <TableCell className="font-medium px-4 py-3 text-sm">{wallet.name}</TableCell>
                        <TableCell className="px-4 py-3 text-sm">{wallet.typeName}</TableCell>
                        <TableCell className="font-mono px-4 py-3 text-sm">{wallet.number || t('notSet')}</TableCell>
                        <TableCell className="text-right px-4 py-3 text-sm">
                          <CurrencyDisplay amountInCents={wallet.amount.amount} currencyCode={wallet.amount.currency.code} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
