
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CurrencyDisplay } from '@/components/common/currency-display';
import { useAuth } from '@/context/auth-context';
import { getTransactionTypes, getTransactionsList } from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import { CalendarIcon, PlusCircle, ListFilter, RefreshCwIcon, History, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Transaction, TransactionType as AppTransactionType } from '@/types'; // Renamed to avoid conflict
import { useGlobalLoader } from '@/context/global-loader-context';

const mockCategories = [
  { id: '1', nameKey: 'category_food' },
  { id: '2', nameKey: 'category_transport' },
  { id: '3', nameKey: 'category_shopping' },
  { id: '4', nameKey: 'category_utilities' },
  { id: '5', nameKey: 'category_entertainment' },
];

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
  const [rawTransactions, setRawTransactions] = useState<Transaction[] | null>(null);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  const [filters, setFilters] = useState<{
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    typeId?: string; // This refers to the numeric type from API (e.g. 1 for INCOME)
  }>({});
  const [activeTab, setActiveTab] = useState<"all" | "recurring">("all");

  // Effect for global loader
  useEffect(() => {
    setGlobalLoading(isLoadingTypes || isLoadingTransactions);
  }, [isLoadingTypes, isLoadingTransactions, setGlobalLoading]);

  // Fetch transaction types
  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoadingTypes(true);
      getTransactionTypes(token)
        .then(data => {
          // API returns types like { "1": "INCOME", "2": "EXPENSE" }
          // We need to transform it to AppTransactionType[]: [{ id: "1", name: "INCOME" }, ...]
          const formattedTypes = Object.entries(data.types).map(([id, name]) => ({
            id: id, // Keep original ID (string "1", "2")
            name: name as string // "INCOME", "EXPENSE"
          }));
          setTransactionTypes(formattedTypes);
        })
        .catch(error => {
          console.error("Failed to fetch transaction types", error);
          toast({ variant: "destructive", title: t('errorFetchingData'), description: error.message });
        })
        .finally(() => setIsLoadingTypes(false));
    } else {
      setIsLoadingTypes(false);
    }
  }, [token, isAuthenticated, t, toast]);

  // Fetch transactions
  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoadingTransactions(true);
      const params: Record<string, string> = {};
      if (filters.startDate) params.startDate = format(filters.startDate, 'yyyy-MM-dd');
      if (filters.endDate) params.endDate = format(filters.endDate, 'yyyy-MM-dd');
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.typeId) params.typeId = filters.typeId; // This is the numeric type for API
      if (activeTab === "recurring") params.isRecurring = "true";

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
  }, [isAuthenticated, token, filters, activeTab, t, toast]);

  const processedAndGroupedTransactions = useMemo(() => {
    if (!rawTransactions || transactionTypes.length === 0) {
      return { groups: {}, sortedDateKeys: [] };
    }

    const processed = rawTransactions.map(tx => {
      // tx.type is number (1, 2), transactionTypes[].id is string ("1", "2")
      const typeDetails = transactionTypes.find(tt => tt.id === String(tx.type));
      return {
        ...tx,
        typeName: typeDetails ? typeDetails.name : t('transactionType_UNKNOWN')
      };
    });
    
    // Further filter by activeTab if needed (e.g., if API doesn't fully filter recurring)
    // For now, assume API handles recurring filter with params.isRecurring
    // If client-side recurring filtering for 'all' tab vs 'recurring' tab is needed based on tx.isRecurring:
    // let currentTabTransactions = processed;
    // if (activeTab === "recurring") {
    //   currentTabTransactions = processed.filter(tx => tx.isRecurring);
    // } else if (activeTab === "all") {
    //   // currentTabTransactions = processed; // Or specific logic if 'all' means non-recurring for this view
    // }


    const groups: GroupedTransactions = processed.reduce((acc, tx) => {
      const dateKey = format(parseISO(tx.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(tx);
      return acc;
    }, {} as GroupedTransactions);

    const sortedDateKeys = Object.keys(groups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return { groups, sortedDateKeys };
  }, [rawTransactions, transactionTypes, t]);


  const handleFilterChange = <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    // Re-fetch is triggered by `filters` changing in the useEffect dependency array for fetching transactions
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleAddNewTransaction = () => {
    router.push('/transactions/new');
  };

  const renderTransactionTableContent = () => {
    if (isLoadingTransactions || isLoadingTypes) { // Check both as processing depends on types
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-40 text-center"> {/* Adjusted colSpan */}
            <RefreshCwIcon className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">{t('loading')}</p>
          </TableCell>
        </TableRow>
      );
    }

    const { groups, sortedDateKeys } = processedAndGroupedTransactions;

    if (sortedDateKeys.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="py-10 text-center text-muted-foreground"> {/* Adjusted colSpan */}
            {t(activeTab === 'recurring' ? 'noRecurringTransactionsFound' : 'noTransactionsFound')}
          </TableCell>
        </TableRow>
      );
    }

    return sortedDateKeys.flatMap(dateKey => {
      const transactionsForDate = groups[dateKey];
      const formattedDate = format(parseISO(dateKey), "PPP"); // e.g., July 28, 2024

      return [
        <TableRow key={dateKey} className="bg-muted/30 hover:bg-muted/40 sticky top-0 z-10">
          <TableCell colSpan={4} className="py-2 px-4 font-semibold text-foreground">
            {formattedDate}
          </TableCell>
        </TableRow>,
        ...transactionsForDate.map(tx => (
          <TableRow key={tx.id}>
            <TableCell className="hidden md:table-cell w-24"> {/* Time column */}
               {tx.date ? format(parseISO(tx.date), "p") : 'N/A'} {/* e.g., 2:30 PM */}
            </TableCell>
            <TableCell>
              <div className="font-medium">{tx.description || t('noDescription')}</div>
              <div className="text-xs text-muted-foreground md:hidden">
                  {tx.date ? format(parseISO(tx.date), "p") : 'N/A'} {/* Time for mobile */}
              </div>
            </TableCell>
            <TableCell>
              {/* tx.typeName should be populated: "INCOME" or "EXPENSE" */}
              {tx.typeName ? t(`transactionType_${tx.typeName}` as any, {defaultValue: tx.typeName}) : t('transactionType_UNKNOWN')}
            </TableCell>
            <TableCell className="text-right">
              <CurrencyDisplay amountInCents={tx.amount.amount} currencyCode={tx.amount.currency.code} />
            </TableCell>
          </TableRow>
        ))
      ];
    });
  };


  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-3xl font-bold text-foreground">{t('transactions')}</h1>
          <Button onClick={handleAddNewTransaction} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-5 w-5" />
            {t('addNewTransaction')}
          </Button>
        </div>

        <Accordion type="single" collapsible className="w-full" defaultValue="">
          <AccordionItem value="filters" className="border-b-0">
            <Card className="shadow-lg">
              <AccordionTrigger className="w-full px-6 py-4 hover:no-underline">
                <div className="flex items-center text-xl font-semibold text-foreground">
                  <ListFilter className="mr-3 h-6 w-6 text-primary" />
                  {t('filterTransactionsTitle')}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1">
                      <Label htmlFor="startDate">{t('startDate')}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button id="startDate" variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.startDate ? format(filters.startDate, "PPP") : <span>{t('selectDate')}</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={filters.startDate} onSelect={(date) => handleFilterChange('startDate', date || undefined)} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="endDate">{t('endDate')}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button id="endDate" variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.endDate ? format(filters.endDate, "PPP") : <span>{t('selectDate')}</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={filters.endDate} onSelect={(date) => handleFilterChange('endDate', date || undefined)} disabled={(date) => filters.startDate ? date < filters.startDate : false}/>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="filterCategory">{t('filterByCategory')}</Label>
                      <Select value={filters.categoryId || 'all'} onValueChange={(value) => handleFilterChange('categoryId', value === 'all' ? undefined : value)}>
                        <SelectTrigger id="filterCategory">
                          <SelectValue placeholder={t('selectCategoryPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('allCategories')}</SelectItem>
                          {mockCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{t(cat.nameKey as keyof ReturnType<typeof useTranslation>['translations'])}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="filterType">{t('filterByType')}</Label>
                      {/* Filter by AppTransactionType.id which is string "1", "2" */}
                      <Select value={filters.typeId || 'all'} onValueChange={(value) => handleFilterChange('typeId', value === 'all' ? undefined : value)} disabled={isLoadingTypes}>
                        <SelectTrigger id="filterType">
                          <SelectValue placeholder={isLoadingTypes ? t('loading') : t('selectTypePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('allTypes')}</SelectItem>
                          {transactionTypes.map(type => (
                            // type.id is "1", type.name is "INCOME"
                            <SelectItem key={type.id} value={type.id}>
                              {t(`transactionType_${type.name}` as keyof ReturnType<typeof useTranslation>['translations'])}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={handleClearFilters} disabled={isLoadingTransactions || isLoadingTypes}>{t('clearFiltersButton')}</Button>
                    <Button onClick={handleApplyFilters} disabled={isLoadingTransactions || isLoadingTypes}>
                      {(isLoadingTransactions || isLoadingTypes) && <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />}
                      {t('applyFiltersButton')}
                    </Button>
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "recurring")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3">
            <TabsTrigger value="all" className="gap-2">
              <History className="h-5 w-5" />
              {t('allTransactionsTab')}
            </TabsTrigger>
            <TabsTrigger value="recurring" className="gap-2">
              <RefreshCwIcon className="h-5 w-5" />
              {t('recurringTransactionsTab')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>{t('recentTransactionsTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="hidden md:table-cell w-24">{t('time')}</TableHead> {/* Changed from Date to Time */}
                        <TableHead>{t('description')}</TableHead>
                        <TableHead>{t('transactionType')}</TableHead>
                        <TableHead className="text-right">{t('amount')}</TableHead>
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
          <TabsContent value="recurring">
             <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>{t('recurringTransactionsListTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                   <Table>
                     <TableHeader>
                      <TableRow>
                        <TableHead className="hidden md:table-cell w-24">{t('time')}</TableHead>
                        <TableHead>{t('description')}</TableHead>
                        <TableHead>{t('transactionType')}</TableHead>
                        <TableHead className="text-right">{t('amount')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {renderTransactionTableContent()} {/* Reuses the same rendering logic */}
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
