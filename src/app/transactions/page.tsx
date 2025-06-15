
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CurrencyDisplay } from '@/components/common/currency-display';
import { useAuth } from '@/context/auth-context';
import { getTransactionTypes, getTransactionsList, getTransactionCategories } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { CalendarIcon, PlusCircle, ListFilter, RefreshCwIcon, History } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Transaction, TransactionType as AppTransactionType, Category } from '@/types';
import { useGlobalLoader } from '@/context/global-loader-context';

interface GroupedTransactions {
  [date: string]: Transaction[];
}

export default function TransactionsPage() {
  const { token, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const { setIsLoading: setGlobalLoading } = useGlobalLoader();

  const [transactionTypes, setTransactionTypes] = useState<AppTransactionType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rawTransactions, setRawTransactions] = useState<Transaction[] | null>(null);
  
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  const [filters, setFilters] = useState<{
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    typeId?: string;
  }>({});
  const [activeTab, setActiveTab] = useState<"all" | "recurring">("all");

  useEffect(() => {
    setGlobalLoading(isLoadingTypes || isLoadingCategories || isLoadingTransactions);
  }, [isLoadingTypes, isLoadingCategories, isLoadingTransactions, setGlobalLoading]);

  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoadingTypes(true);
      getTransactionTypes(token)
        .then(data => {
          const formattedTypes = Object.entries(data.types).map(([id, name]) => ({
            id: id,
            name: name as string
          }));
          setTransactionTypes(formattedTypes);
        })
        .catch(error => {
          console.error("Failed to fetch transaction types", error);
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
        })
        .finally(() => setIsLoadingTypes(false));

      setIsLoadingCategories(true);
      getTransactionCategories(token)
        .then(data => {
           const formattedCategories = Object.entries(data.categories).map(([id, name]) => ({
            id: id,
            name: name as string
          }));
          setCategories(formattedCategories);
        })
        .catch(error => {
          console.error("Failed to fetch categories", error);
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
        })
        .finally(() => setIsLoadingCategories(false));
    } else {
      setIsLoadingTypes(false);
      setIsLoadingCategories(false);
    }
  }, [token, isAuthenticated, t, toast]);

  const fetchTransactions = useCallback(() => {
    if (isAuthenticated && token) {
      setIsLoadingTransactions(true);
      const params: Record<string, string> = {};
      if (filters.startDate) params.startDate = format(filters.startDate, 'yyyy-MM-dd');
      if (filters.endDate) params.endDate = format(filters.endDate, 'yyyy-MM-dd');
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.typeId) params.typeId = filters.typeId;
      
      getTransactionsList(token, params)
        .then(result => {
          setRawTransactions(result.transactions || []);
        })
        .catch((error: any) => {
          console.error("Failed to fetch transactions", error);
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message || t('unexpectedError') });
          setRawTransactions([]);
        })
        .finally(() => setIsLoadingTransactions(false));
    } else if (!isAuthenticated || !token) {
      setRawTransactions([]);
      setIsLoadingTransactions(false);
    }
  }, [isAuthenticated, token, filters, t, toast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const processedTransactions = useMemo(() => {
    if (!rawTransactions || transactionTypes.length === 0) {
      return [];
    }
    return rawTransactions.map(tx => {
      const typeDetails = transactionTypes.find(tt => tt.id === String(tx.type));
      return {
        ...tx,
        typeName: typeDetails ? typeDetails.name : t('transactionType_UNKNOWN')
      };
    });
  }, [rawTransactions, transactionTypes, t]);
  
  const currentTabTransactions = useMemo(() => {
    if (activeTab === "recurring") {
      return processedTransactions.filter(tx => tx.isRecurring);
    }
    return processedTransactions;
  }, [processedTransactions, activeTab]);

  const { groups, sortedDateKeys } = useMemo(() => {
    const newGroups: GroupedTransactions = currentTabTransactions.reduce((acc, tx) => {
      const dateKey = format(parseISO(tx.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(tx);
      return acc;
    }, {} as GroupedTransactions);

    const newSortedDateKeys = Object.keys(newGroups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return { groups: newGroups, sortedDateKeys: newSortedDateKeys };
  }, [currentTabTransactions]);


  const handleFilterChange = <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchTransactions(); 
  };

  const handleClearFilters = () => {
    setFilters({});
    setRawTransactions(null); 
    setIsLoadingTransactions(true); 
  };
  
  useEffect(() => {
    if (Object.keys(filters).length === 0 && rawTransactions === null) {
        fetchTransactions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, rawTransactions]); 

  const handleAddNewTransaction = () => {
    router.push('/transactions/new');
  };

  const renderTransactionTableContent = () => {
    if (isLoadingTransactions || isLoadingTypes || isLoadingCategories) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-60 text-center">
            <div className="flex flex-col items-center justify-center">
              <RefreshCwIcon className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-lg text-muted-foreground">{t('loading')}</p>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (sortedDateKeys.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="py-16 text-center text-muted-foreground">
            <div className="flex flex-col items-center justify-center">
                <History className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-xl font-medium">{t(activeTab === 'recurring' ? 'noRecurringTransactionsFound' : 'noTransactionsFound')}</p>
                <p className="text-sm">{t('tryAdjustingFilters')}</p> 
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return sortedDateKeys.map(dateKey => (
      <React.Fragment key={dateKey + '-group'}>
        <TableRow className="bg-muted/50 hover:bg-muted/60 sticky top-0 z-10 dark:bg-muted/20 dark:hover:bg-muted/30">
          <TableCell colSpan={4} className="py-3 px-4 font-semibold text-foreground text-md">
            {format(parseISO(dateKey), "PPP")}
          </TableCell>
        </TableRow>
        {groups[dateKey].map(tx => (
          <TableRow key={tx.id} className="hover:bg-accent/10 dark:hover:bg-accent/5 transition-colors">
            <TableCell className="hidden md:table-cell w-24 py-3 px-4 align-top">
               <span className="text-sm text-muted-foreground">{tx.date ? format(parseISO(tx.date), "p") : 'N/A'}</span>
            </TableCell>
            <TableCell className="py-3 px-4 align-top">
              <div className="font-medium text-foreground">{tx.description || <span className="italic text-muted-foreground">{t('noDescription')}</span>}</div>
              <div className="text-xs text-muted-foreground md:hidden mt-1">
                  {tx.date ? format(parseISO(tx.date), "p") : 'N/A'}
              </div>
            </TableCell>
            <TableCell className="py-3 px-4 align-top">
              <span className={`text-sm ${tx.typeName === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {tx.typeName ? t(`transactionType_${tx.typeName}` as any, {defaultValue: tx.typeName}) : t('transactionType_UNKNOWN')}
              </span>
            </TableCell>
            <TableCell className="text-right py-3 px-4 align-top">
              <CurrencyDisplay amountInCents={tx.amount.amount} currencyCode={tx.amount.currency.code} />
            </TableCell>
          </TableRow>
        ))}
      </React.Fragment>
    ));
  };


  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-4xl font-bold text-foreground">{t('transactions')}</h1>
          <Button onClick={handleAddNewTransaction} className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
            <PlusCircle className="mr-2 h-5 w-5" />
            {t('addNewTransaction')}
          </Button>
        </div>

        <Card className="shadow-xl border-border/60">
          <Accordion type="single" collapsible className="w-full" defaultValue="filters">
            <AccordionItem value="filters" className="border-b-0">
                <AccordionTrigger className="w-full px-6 py-4 hover:no-underline hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors rounded-t-lg">
                  <div className="flex items-center text-xl font-semibold text-foreground">
                    <ListFilter className="mr-3 h-6 w-6 text-primary" />
                    {t('filterTransactionsTitle')}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t border-border/60">
                  <div className="p-6 space-y-6 bg-background rounded-b-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                      <div className="space-y-2">
                        <Label htmlFor="startDate" className="font-medium">{t('startDate')}</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button id="startDate" variant="outline" className="w-full justify-start text-left font-normal hover:border-primary transition-colors">
                              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                              {filters.startDate ? format(filters.startDate, "PPP") : <span className="text-muted-foreground">{t('selectDate')}</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={filters.startDate} onSelect={(date) => handleFilterChange('startDate', date || undefined)} />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate" className="font-medium">{t('endDate')}</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button id="endDate" variant="outline" className="w-full justify-start text-left font-normal hover:border-primary transition-colors">
                              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                              {filters.endDate ? format(filters.endDate, "PPP") : <span className="text-muted-foreground">{t('selectDate')}</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={filters.endDate} onSelect={(date) => handleFilterChange('endDate', date || undefined)} disabled={(date) => filters.startDate ? date < filters.startDate : false}/>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="filterCategory" className="font-medium">{t('filterByCategory')}</Label>
                        <Select value={filters.categoryId || 'all'} onValueChange={(value) => handleFilterChange('categoryId', value === 'all' ? undefined : value)} disabled={isLoadingCategories}>
                          <SelectTrigger id="filterCategory" className="hover:border-primary transition-colors">
                            <SelectValue placeholder={isLoadingCategories ? t('loading') : t('selectCategoryPlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('allCategories')}</SelectItem>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>
                                 {t(`categoryName_${cat.name.replace(/\s+/g, '_').toLowerCase()}` as keyof ReturnType<typeof useTranslation>['translations'], { defaultValue: cat.name })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="filterType" className="font-medium">{t('filterByType')}</Label>
                        <Select value={filters.typeId || 'all'} onValueChange={(value) => handleFilterChange('typeId', value === 'all' ? undefined : value)} disabled={isLoadingTypes}>
                          <SelectTrigger id="filterType" className="hover:border-primary transition-colors">
                            <SelectValue placeholder={isLoadingTypes ? t('loading') : t('selectTypePlaceholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('allTypes')}</SelectItem>
                            {transactionTypes.map(type => (
                              <SelectItem key={type.id} value={type.id}>
                                {t(`transactionType_${type.name}` as keyof ReturnType<typeof useTranslation>['translations'])}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button variant="outline" onClick={handleClearFilters} disabled={isLoadingTransactions || isLoadingTypes || isLoadingCategories} className="shadow-sm hover:shadow-md transition-shadow">{t('clearFiltersButton')}</Button>
                      <Button onClick={handleApplyFilters} disabled={isLoadingTransactions || isLoadingTypes || isLoadingCategories} className="shadow-sm hover:shadow-md transition-shadow">
                        {(isLoadingTransactions || isLoadingTypes || isLoadingCategories) && <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />}
                        {t('applyFiltersButton')}
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Card>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "recurring")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex shadow-inner bg-muted/60 dark:bg-muted/30 p-1.5 rounded-lg">
            <TabsTrigger value="all" className="flex-1 gap-2 data-[state=active]:shadow-md data-[state=active]:bg-background dark:data-[state=active]:bg-muted/50 transition-all duration-150 py-2.5">
              <History className="h-5 w-5" />
              {t('allTransactionsTab')}
            </TabsTrigger>
            <TabsTrigger value="recurring" className="flex-1 gap-2 data-[state=active]:shadow-md data-[state=active]:bg-background dark:data-[state=active]:bg-muted/50 transition-all duration-150 py-2.5">
              <RefreshCwIcon className="h-5 w-5" />
              {t('recurringTransactionsTab')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <Card className="shadow-xl border-border/60">
              <CardHeader className="border-b border-border/60">
                <CardTitle className="text-2xl font-semibold text-foreground">{t('recentTransactionsTitle')}</CardTitle>
                <CardDescription>{t('viewAllYourTransactions')}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30 dark:bg-muted/10">
                      <TableRow>
                        <TableHead className="hidden md:table-cell w-28 px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('time')}</TableHead>
                        <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('description')}</TableHead>
                        <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('transactionType')}</TableHead>
                        <TableHead className="text-right px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('amount')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {renderTransactionTableContent()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="recurring" className="mt-6">
             <Card className="shadow-xl border-border/60">
              <CardHeader className="border-b border-border/60">
                <CardTitle className="text-2xl font-semibold text-foreground">{t('recurringTransactionsListTitle')}</CardTitle>
                <CardDescription>{t('viewYourRecurringTransactions')}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                   <Table>
                     <TableHeader className="bg-muted/30 dark:bg-muted/10">
                      <TableRow>
                        <TableHead className="hidden md:table-cell w-28 px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('time')}</TableHead>
                        <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('description')}</TableHead>
                        <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('transactionType')}</TableHead>
                        <TableHead className="text-right px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('amount')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {renderTransactionTableContent()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

