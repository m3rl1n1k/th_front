
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';

import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/common/currency-display';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/context/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { 
  getTransactionById, 
  getTransactionTypes, 
  getTransactionFrequencies, 
  getMainCategories 
} from '@/lib/api';
import type { 
  Transaction, 
  TransactionType as AppTransactionType, 
  Frequency, 
  SubCategory 
} from '@/types';
import { ArrowLeft, Edit3, Loader2, AlertTriangle, DollarSign, Tag, CalendarDays, Repeat, WalletIcon, Info } from 'lucide-react';

export default function ViewTransactionPage() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeName, setTypeName] = useState<string | null>(null);
  const [frequencyName, setFrequencyName] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);

  const fetchTransactionDetails = useCallback(async () => {
    if (!id || !token) {
      setIsLoading(false);
      if (!token) setError(t('tokenMissingError'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [txData, typesData, frequenciesData, mainCategoriesData] = await Promise.all([
        getTransactionById(id, token),
        getTransactionTypes(token),
        getTransactionFrequencies(token),
        getMainCategories(token)
      ]);

      setTransaction(txData);

      // Map Type ID to Name
      const typeDetail = Object.entries(typesData.types).find(([typeId]) => typeId === String(txData.type));
      setTypeName(typeDetail ? t(`transactionType_${typeDetail[1]}` as any, {defaultValue: typeDetail[1]}) : t('transactionType_UNKNOWN'));

      // Map Frequency ID to Name
      const freqDetail = Object.entries(frequenciesData.periods).find(([freqId]) => freqId === String(txData.frequencyId));
      setFrequencyName(freqDetail ? t(`frequencyName_${freqDetail[1].toLowerCase().replace(/\s+/g, '_')}` as any, {defaultValue: freqDetail[1]}) : t('notApplicable'));
      
      // Map Category ID to Name
      if (txData.subCategory?.id) {
        const allSubCategories = mainCategoriesData.flatMap(mc => mc.subCategories);
        const catDetail = allSubCategories.find(sc => String(sc.id) === String(txData.subCategory!.id));
        setCategoryName(catDetail ? t(`categoryName_${catDetail.name.replace(/\s+/g, '_').toLowerCase()}` as any, { defaultValue: catDetail.name }) : t('noCategory'));
      } else {
        setCategoryName(t('noCategory'));
      }

    } catch (err: any) {
      console.error("Failed to fetch transaction details:", err);
      setError(err.message || t('errorFetchingData'));
      toast({ variant: "destructive", title: t('errorFetchingData'), description: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [id, token, t, toast]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactionDetails();
    } else if (!isAuthenticated && !token) {
        setIsLoading(false);
    }
  }, [isAuthenticated, token, fetchTransactionDetails]);

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
            <Button variant="outline" onClick={() => router.push('/transactions')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backButton')}
            </Button>
          </div>
        </Card>
      </MainLayout>
    );
  }

  if (!transaction) {
    return (
      <MainLayout>
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardHeader>
            <CardTitle>{t('transactionNotFoundTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p>{t('transactionNotFoundDesc')}</p>
          </CardContent>
          <div className="flex justify-end p-4">
            <Button variant="outline" onClick={() => router.push('/transactions')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backButton')}
            </Button>
          </div>
        </Card>
      </MainLayout>
    );
  }
  
  // Define detailItems here, after transaction is confirmed to be non-null
  const detailItems = [
    { labelKey: 'amount', value: <CurrencyDisplay amountInCents={transaction.amount.amount} currencyCode={transaction.amount.currency.code} />, icon: <DollarSign className="text-primary" /> },
    { labelKey: 'transactionType', value: typeName, icon: <Tag className="text-primary" /> },
    { labelKey: 'date', value: format(parseISO(transaction.date), "PPPp"), icon: <CalendarDays className="text-primary" /> },
    { labelKey: 'wallet', value: transaction.wallet.name, icon: <WalletIcon className="text-primary" /> },
    { labelKey: 'category', value: categoryName, icon: <Info className="text-primary" /> },
    { labelKey: 'frequency', value: frequencyName, icon: <Repeat className="text-primary" /> },
    { labelKey: 'description', value: transaction.description || t('noDescription'), icon: <Info className="text-primary" />, fullWidth: true },
  ];


  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="font-headline text-3xl font-bold text-foreground">
                {t('viewTransactionTitle')} #{transaction.id}
            </h1>
        </div>

        <Card className="shadow-xl overflow-hidden">
            <CardHeader className="bg-muted/30 dark:bg-muted/10 border-b">
              <CardTitle className="text-2xl">{t('transactionDetailsTitle')}</CardTitle>
              <CardDescription>{t('transactionDetailsDesc', {id: String(transaction.id)})}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {detailItems.map(item => (
                    <div key={item.labelKey} className={`flex items-start space-x-4 ${item.fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
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
        <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => router.push('/transactions')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('backToListButton')}
            </Button>
            <Button asChild variant="default">
                <Link href={`/transactions/${transaction.id}/edit`}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    {t('editTransactionButton')}
                </Link>
            </Button>
        </div>
      </div>
    </MainLayout>
  );
}

