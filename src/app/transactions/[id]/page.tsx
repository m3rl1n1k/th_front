
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
  SubCategory,
  ApiError,
} from '@/types';
import { ArrowLeft, Edit3, Loader2, AlertTriangle, DollarSign, Tag, CalendarDays, Repeat, WalletIcon, Info, ArrowRightLeft } from 'lucide-react';

const generateCategoryTranslationKey = (name: string | undefined | null): string => {
  if (!name) return '';
  return name.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

export default function ViewTransactionPage() {
  const { token, isAuthenticated, promptSessionRenewal } = useAuth();
  const { t, dateFnsLocale } = useTranslation(); 
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
  const [detailItems, setDetailItems] = useState<Array<{ labelKey: string; value: React.ReactNode; icon: React.ReactElement; fullWidth?: boolean }>>([]);


  const fetchTransactionDetails = useCallback(async () => {
    if (!id || !token) {
      setIsLoading(false);
      if (!token) setError(t('tokenMissingError'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [txResponse, typesData, frequenciesDataResponse, mainCategoriesData] = await Promise.all([
        getTransactionById(id, token), 
        getTransactionTypes(token),
        getTransactionFrequencies(token),
        getMainCategories(token)
      ]);

      const txData = txResponse; 
      setTransaction(txData);

      const txTypeString = String(txData.type);
      const typeDetail = Object.entries(typesData.types).find(([apiTypeId]) => apiTypeId === txTypeString);
      
      if (typeDetail) {
        const apiTypeName = typeDetail[1]; // e.g., "INCOME", "EXPENSE"
        const keyForTranslation = `transactionType_${apiTypeName}`;
        setTypeName(t(keyForTranslation, { defaultValue: apiTypeName }));
      } else {
        setTypeName(t('transactionType_UNKNOWN'));
      }
      
      const formattedFrequencies = Object.entries(frequenciesDataResponse.periods).map(([freqId, name]) => ({ id: freqId, name: name as string }));
      const freqIdFromTx = String(txData.frequencyId);
      const freqObject = formattedFrequencies.find(f => f.id === freqIdFromTx);

      if (freqObject) {
        setFrequencyName(t(`frequency_${freqObject.name}` as any, {defaultValue: freqObject.name}));
      } else {
        setFrequencyName(t('notApplicable'));
      }
      
      if (txData.subCategory?.id) {
        const allSubCategories = mainCategoriesData.flatMap(mc => mc.subCategories || []);
        const catDetail = allSubCategories.find(sc => String(sc.id) === String(txData.subCategory!.id));
        setCategoryName(catDetail ? t(generateCategoryTranslationKey(catDetail.name), { defaultValue: catDetail.name }) : t('noCategory'));
      } else {
        setCategoryName(t('noCategory'));
      }

    } catch (err: any) {
      if ((err as ApiError).code === 401) {
        promptSessionRenewal();
        return;
      }
      setError(err.message || t('errorFetchingData'));
      toast({ variant: "destructive", title: t('errorFetchingData'), description: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [id, token, t, toast, promptSessionRenewal]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactionDetails();
    } else if (!isAuthenticated && !token) {
        setIsLoading(false);
    }
  }, [isAuthenticated, token, fetchTransactionDetails]);

  useEffect(() => {
    if (transaction && typeName && frequencyName && categoryName !== null) { 
      let typeIconElement = <Info className="text-primary" />;
      if (typeName === t('transactionType_INCOME')) {
        typeIconElement = <DollarSign className="text-green-500" />;
      } else if (typeName === t('transactionType_EXPENSE')) {
        typeIconElement = <DollarSign className="text-red-500" />;
      } else if (typeName === t('transactionType_TRANSFER')) {
        typeIconElement = <ArrowRightLeft className="text-blue-500" />;
      }


      const items: Array<{ labelKey: string; value: React.ReactNode; icon: React.ReactElement; fullWidth?: boolean }> = [
        { labelKey: 'amount', value: <CurrencyDisplay amountInCents={transaction.amount.amount} currencyCode={transaction.amount.currency.code} />, icon: typeIconElement },
        { labelKey: 'transactionType', value: typeName, icon: <Tag className="text-primary" /> },
        { labelKey: 'date', value: format(parseISO(transaction.date), "PPPp", { locale: dateFnsLocale }), icon: <CalendarDays className="text-primary" /> },
        { labelKey: 'wallet', value: transaction.wallet.name, icon: <WalletIcon className="text-primary" /> },
        { labelKey: 'category', value: categoryName, icon: <Info className="text-primary" /> },
        { labelKey: 'frequency', value: frequencyName, icon: <Repeat className="text-primary" /> },
      ];

      if (transaction.exchangeRate && transaction.exchangeRate !== 1) {
        items.push({
          labelKey: 'exchangeRateLabel',
          value: transaction.exchangeRate.toString(),
          icon: <Repeat className="text-primary" />
        });
      }
      items.push({ labelKey: 'description', value: transaction.description || t('noDescription'), icon: <Info className="text-primary" />, fullWidth: true });
      setDetailItems(items);
    }
  }, [transaction, typeName, frequencyName, categoryName, t, dateFnsLocale]);


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
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => router.push('/transactions')} className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('backToListButton')}
            </Button>
            <Button asChild variant="default" className="w-full sm:w-auto">
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
