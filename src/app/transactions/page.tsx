
"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CurrencyDisplay } from '@/components/common/currency-display';
import { useAuth } from '@/context/auth-context';
import {
  getTransactionTypes,
  getTransactionsList,
  getMainCategories,
  deleteTransaction,
  getRepeatedTransactionsList,
  toggleRepeatedTransactionStatus,
  deleteRepeatedTransactionDefinition,
  getTransactionFrequencies
} from '@/lib/api';
import { useTranslation } from '@/context/i18n-context';
import {
  CalendarIcon, PlusCircle, ListFilter, RefreshCwIcon, History,
  ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, HelpCircle, MoreHorizontal, Eye, Edit3, Trash2, Loader2, Power, PowerOff, FileText, Shapes, ChevronsUpDown
} from 'lucide-react';
import { format, parseISO, differenceInDays, add, sub } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Transaction, TransactionType as AppTransactionType, MainCategory, RepeatedTransactionEntry, Frequency as AppFrequency, GetTransactionsListResponse, PaginationInfo, ApiError } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { CategorySelector } from '@/components/common/category-selector';

interface GroupedTransactions {
  [date: string]: Transaction[];
}

const generateCategoryTranslationKey = (name: string | undefined | null): string => {
  if (!name) return '';
  return name.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

export default function TransactionsPage() {
  const { user, token, isAuthenticated } = useAuth();
  const { t, dateFnsLocale } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [transactionTypes, setTransactionTypes] = useState<AppTransactionType[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [apiFrequencies, setApiFrequencies] = useState<AppFrequency[]>([]);

  const [rawTransactions, setRawTransactions] = useState<Transaction[]>([]);
  const [repeatedDefinitions, setRepeatedDefinitions] = useState<RepeatedTransactionEntry[] | null>(null);

  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingFrequencies, setIsLoadingFrequencies] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingRepeatedDefinitions, setIsLoadingRepeatedDefinitions] = useState(false);

  const [filters, setFilters] = useState<{
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    typeId?: string;
  }>({});
  const [activeTab, setActiveTab] = useState<"all" | "recurring">("all");

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [selectedTransactionForDelete, setSelectedTransactionForDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [initiatingActionForTxId, setInitiatingActionForTxId] = useState<string | number | null>(null);

  const [definitionActionStates, setDefinitionActionStates] = useState<Record<string | number, { isLoading: boolean }>>({});
  const [showDeleteDefinitionDialog, setShowDeleteDefinitionDialog] = useState(false);
  const [selectedDefinitionForDelete, setSelectedDefinitionForDelete] = useState<RepeatedTransactionEntry | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const loaderRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    if (isAuthenticated && token) {
      setIsLoadingTypes(true);
      getTransactionTypes(token)
        .then(data => {
          if (data && data.types && typeof data.types === 'object') {
            const formattedTypes = Object.entries(data.types || {}).map(([id, name]) => ({
              id: id,
              name: name as string
            }));
            setTransactionTypes(formattedTypes);
          } else {
            setTransactionTypes([]);
          }
        })
        .catch(error => {
          setTransactionTypes([]);
        })
        .finally(() => setIsLoadingTypes(false));

      setIsLoadingCategories(true);
      getMainCategories(token)
        .then(data => {
          setMainCategories(Array.isArray(data) ? data : []);
        })
        .catch(error => {
          setMainCategories([]);
        })
        .finally(() => setIsLoadingCategories(false));

      setIsLoadingFrequencies(true);
      getTransactionFrequencies(token)
        .then(data => {
          const formattedFrequencies = Object.entries(data.periods).map(([id, name]) => ({
            id: id,
            name: name as string
          }));
          setApiFrequencies(formattedFrequencies);
        })
        .catch(error => {
            setApiFrequencies([]);
        })
        .finally(() => setIsLoadingFrequencies(false));

    } else {
      setIsLoadingTypes(false);
      setIsLoadingCategories(false);
      setIsLoadingFrequencies(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated]);

  const fetchTransactions = useCallback((pageToFetch: number, filtersToUse: typeof filters) => {
    if (isAuthenticated && token && activeTab === "all") {
      if (pageToFetch === 1) {
        setIsLoadingTransactions(true);
        setRawTransactions([]);
      } else {
        setIsLoadingMore(true);
      }
      const params: Record<string, string | number | undefined> = {};
      if (filtersToUse.startDate) params.startDate = format(filtersToUse.startDate, 'yyyy-MM-dd');
      if (filtersToUse.endDate) params.endDate = format(filtersToUse.endDate, 'yyyy-MM-dd');
      if (filtersToUse.categoryId) params.categoryId = filtersToUse.categoryId;
      if (filtersToUse.typeId) params.typeId = filtersToUse.typeId;

      params.page = pageToFetch;

      getTransactionsList(token, params)
        .then((result: GetTransactionsListResponse) => {
          const newItems = result.transactions.items || [];
          const pagination = result.transactions.pagination;

          setRawTransactions(prev => pageToFetch === 1 ? newItems : [...prev, ...newItems]);
          setCurrentPage(pagination.page);
          setTotalPages(pagination.total_pages);
        })
        .catch((error: ApiError) => {
          if (pageToFetch === 1) setRawTransactions([]);
          setTotalPages(1);
        })
        .finally(() => {
          if (pageToFetch === 1) setIsLoadingTransactions(false);
          setIsLoadingMore(false);
        });
    } else if (!isAuthenticated || !token) {
      setRawTransactions([]);
      setIsLoadingTransactions(false);
      setIsLoadingMore(false);
      setTotalPages(1);
    }
  }, [isAuthenticated, token, activeTab]);

  const fetchRepeatedDefinitions = useCallback((showLoading = true) => {
    if (isAuthenticated && token && activeTab === "recurring") {
        if (showLoading) setIsLoadingRepeatedDefinitions(true);
        getRepeatedTransactionsList(token)
            .then(response => setRepeatedDefinitions(response.repeated_transactions || []))
            .catch((error: ApiError) => {
                setRepeatedDefinitions([]);
            })
            .finally(() => {
                if (showLoading) setIsLoadingRepeatedDefinitions(false);
            });
    } else if (!isAuthenticated || !token) {
        setRepeatedDefinitions([]);
        if (showLoading) setIsLoadingRepeatedDefinitions(false);
    }
  }, [isAuthenticated, token, activeTab]);

  useEffect(() => {
    if (activeTab === "all" && isAuthenticated && token) {
      fetchTransactions(1, filters);
    } else if (activeTab === "recurring" && isAuthenticated && token) {
      fetchRepeatedDefinitions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token, activeTab]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && currentPage < totalPages && !isLoadingMore && !isLoadingTransactions && activeTab === "all") {
          fetchTransactions(currentPage + 1, filters);
        }
      },
      { threshold: 1.0 } 
    );

    const currentLoaderRef = loaderRef.current;
    if (currentLoaderRef) {
      observer.observe(currentLoaderRef);
    }

    return () => {
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef);
      }
    };
  }, [loaderRef, currentPage, totalPages, isLoadingMore, isLoadingTransactions, fetchTransactions, activeTab, filters]);

  useEffect(() => {
    setInitiatingActionForTxId(null);
  }, [pathname]);

  const processedTransactions = useMemo(() => {
    return rawTransactions.map(tx => {
      const categoryName = tx.subCategory
        ? t(generateCategoryTranslationKey(tx.subCategory.name), {defaultValue: tx.subCategory.name})
        : t('noCategory');
      return {
        ...tx,
        typeName: transactionTypes.find(tt => tt.id === String(tx.type))?.name || t('transactionType_UNKNOWN'),
        categoryName: categoryName
      };
    });
  }, [rawTransactions, transactionTypes, t]);

  const { groups, sortedDateKeys } = useMemo(() => {
    const newGroups: GroupedTransactions = processedTransactions.reduce((acc, tx) => {
      const dateKey = format(parseISO(tx.date), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(tx);
      return acc;
    }, {} as GroupedTransactions);
    const newSortedDateKeys = Object.keys(newGroups).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return { groups: newGroups, sortedDateKeys: newSortedDateKeys };
  }, [processedTransactions]);

  const getFrequencyNameById = useCallback((frequencyApiId: string) => {
    const freqObj = apiFrequencies.find(f => f.id === frequencyApiId);
    if (freqObj) {
      const translationKey = `frequency_${freqObj.name}`;
      return t(translationKey as any, {defaultValue: freqObj.name});
    }
    return t('notApplicable');
  }, [apiFrequencies, t]);

  const getStatusName = useCallback((status: number) => {
    return status === 1 ? t('statusActive') : t('statusInactive');
  }, [t]);

  const handleFilterChange = <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    if (filters.startDate && filters.endDate && differenceInDays(filters.endDate, filters.startDate) > 365) {
      toast({
        variant: "destructive",
        title: t('errorTitle'),
        description: t('dateRangeTooLargeError'),
      });
      return;
    }
    setRawTransactions([]);
    setCurrentPage(1);
    fetchTransactions(1, filters);
  };
  
  const disabledStartDate = (date: Date): boolean => {
    if (date > new Date()) return true;
    if (filters.endDate) {
        const oneYearBeforeEndDate = sub(filters.endDate, { years: 1 });
        return date > filters.endDate || date < oneYearBeforeEndDate;
    }
    return false;
  };

  const disabledEndDate = (date: Date): boolean => {
    if (date > new Date()) return true;
    if (filters.startDate) {
        const oneYearAfterStartDate = add(filters.startDate, { years: 1 });
        return date < filters.startDate || date > oneYearAfterStartDate;
    }
    return false;
  };

  const handleClearFilters = () => {
    setFilters({});
    setRawTransactions([]);
    setCurrentPage(1);
    setTotalPages(1);
    fetchTransactions(1, {});
  };

  const handleAddNewTransaction = () => router.push('/transactions/new/select-category');

  const openDeleteDialog = (transaction: Transaction) => {
    setSelectedTransactionForDelete(transaction);
    setDeleteConfirmationOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!selectedTransactionForDelete || !token) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(selectedTransactionForDelete.id, token);
      toast({ title: t('transactionDeletedTitle'), description: t('transactionDeletedDesc') });
      setRawTransactions(prev => prev.filter(tx => tx.id !== selectedTransactionForDelete.id));
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorDeletingTransaction'), description: error.message || t('unexpectedError') });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmationOpen(false);
      setSelectedTransactionForDelete(null);
    }
  };

  const handleViewAction = (txId: string | number) => {
    setInitiatingActionForTxId(txId);
    router.push(`/transactions/${txId}`);
  };

  const handleEditAction = (txId: string | number) => {
    setInitiatingActionForTxId(txId);
    router.push(`/transactions/${txId}/edit`);
  };

  const handleToggleDefinitionStatus = async (definition: RepeatedTransactionEntry) => {
    if (!token) return;
    setDefinitionActionStates(prev => ({ ...prev, [definition.id]: { isLoading: true } }));
    try {
      await toggleRepeatedTransactionStatus(definition.id, token);
      toast({ title: t('statusToggledTitle'), description: t('statusToggledDesc')});
      fetchRepeatedDefinitions(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorTogglingStatus'), description: error.message || t('unexpectedError') });
    } finally {
      setDefinitionActionStates(prev => ({ ...prev, [definition.id]: { isLoading: false } }));
    }
  };

  const openDeleteDefinitionDialog = (definition: RepeatedTransactionEntry) => {
    setSelectedDefinitionForDelete(definition);
    setShowDeleteDefinitionDialog(true);
  };

  const handleDeleteDefinitionConfirmed = async () => {
    if (!selectedDefinitionForDelete || !token) return;
    setDefinitionActionStates(prev => ({ ...prev, [selectedDefinitionForDelete.id]: { isLoading: true } }));
    try {
      await deleteRepeatedTransactionDefinition(selectedDefinitionForDelete.id, token);
      toast({ title: t('definitionRemovedTitle'), description: t('definitionRemovedDesc')});
      fetchRepeatedDefinitions(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: t('errorRemovingDefinition'), description: error.message || t('unexpectedError') });
    } finally {
      setDefinitionActionStates(prev => ({ ...prev, [selectedDefinitionForDelete.id]: { isLoading: false } }));
      setShowDeleteDefinitionDialog(false);
      setSelectedDefinitionForDelete(null);
    }
  };


  const renderTransactionTableContent = () => {
    if (isLoadingTransactions && rawTransactions.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-60 text-center">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-lg text-muted-foreground">{t('loading')}</p>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (sortedDateKeys.length === 0 && !isLoadingTransactions) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
            <div className="flex flex-col items-center justify-center">
                <History className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-xl font-medium">{t('noTransactionsFound')}</p>
                <p className="text-sm">{t('tryAdjustingFilters')}</p>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return sortedDateKeys.map(dateKey => (
      <React.Fragment key={dateKey + '-group'}>
        <TableRow className="bg-muted/50 hover:bg-muted/60 sticky top-0 z-10 dark:bg-muted/20 dark:hover:bg-muted/30">
          <TableCell colSpan={7} className="py-3 px-4 font-semibold text-foreground text-md">
            {format(parseISO(dateKey), "PPP", { locale: dateFnsLocale })}
          </TableCell>
        </TableRow>
        {groups[dateKey].map(tx => {
          let typeIcon = <HelpCircle className="h-5 w-5 text-muted-foreground" />;
          if (tx.typeName?.toUpperCase() === 'INCOME') {
              typeIcon = <ArrowUpCircle className="h-5 w-5 text-green-500" />;
          } else if (tx.typeName?.toUpperCase() === 'EXPENSE') {
              typeIcon = <ArrowDownCircle className="h-5 w-5 text-red-500" />;
          } else if (tx.typeName?.toUpperCase() === 'TRANSFER') {
              typeIcon = <ArrowRightLeft className="h-5 w-5 text-blue-500" />;
          }

          const showLoaderForThisTx =
            (initiatingActionForTxId === tx.id) ||
            (selectedTransactionForDelete?.id === tx.id && (isDeleting || deleteConfirmationOpen));

          return (
            <TableRow key={tx.id} className="hover:bg-accent/10 dark:hover:bg-accent/5 transition-colors">
              <TableCell className="py-3 px-4 align-top text-sm">
                {tx.date ? format(parseISO(tx.date), "p", { locale: dateFnsLocale }) : 'N/A'}
              </TableCell>
              <TableCell className="py-3 px-4 align-top text-center">
                {typeIcon}
              </TableCell>
              <TableCell className="py-3 px-4 align-top text-sm">
                {tx.categoryName}
              </TableCell>
              <TableCell className="hidden lg:table-cell py-3 px-4 align-top text-sm text-muted-foreground max-w-xs truncate" title={tx.description || ''}>
                {tx.description || <span className="italic">{t('noDescription')}</span>}
              </TableCell>
              <TableCell className="text-right py-3 px-4 align-top text-sm">
                <CurrencyDisplay amountInCents={tx.amount.amount} currencyCode={tx.amount.currency.code} />
              </TableCell>
              <TableCell className="py-3 px-4 align-top text-sm">
                {tx.wallet.name}
              </TableCell>
              <TableCell className="py-3 px-4 align-top text-sm text-center">
                <DropdownMenu onOpenChange={(open) => { if (!open) setInitiatingActionForTxId(null); }}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                       {showLoaderForThisTx ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreHorizontal className="h-4 w-4" />
                      )}
                      <span className="sr-only">{t('actions')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => handleViewAction(tx.id)}
                      className="flex items-center cursor-pointer"
                      disabled={initiatingActionForTxId === tx.id}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {t('viewAction')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => handleEditAction(tx.id)}
                      className="flex items-center cursor-pointer"
                      disabled={initiatingActionForTxId === tx.id}
                    >
                      <Edit3 className="mr-2 h-4 w-4" />
                      {t('editAction')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => openDeleteDialog(tx)}
                      className="text-destructive focus:text-destructive flex items-center cursor-pointer"
                      disabled={isDeleting && selectedTransactionForDelete?.id === tx.id}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('deleteAction')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </React.Fragment>
    ));
  };

  const renderRepeatedDefinitionsTableContent = () => {
    if (isLoadingRepeatedDefinitions || isLoadingFrequencies) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-60 text-center">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-lg text-muted-foreground">{t('loading')}</p>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (!repeatedDefinitions || repeatedDefinitions.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
             <div className="flex flex-col items-center justify-center">
                <RefreshCwIcon className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-xl font-medium">{t('noRecurringDefinitionsFound')}</p>
                <p className="text-sm">{t('addNewTransaction')}</p>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return repeatedDefinitions.map(def => {
      const isActionLoading = definitionActionStates[def.id]?.isLoading || false;
      const templateTransactionId = def.transaction?.id;

      return (
      <TableRow key={def.id} className="hover:bg-accent/10 dark:hover:bg-accent/5 transition-colors">
        <TableCell className="py-3 px-4 align-top text-sm">
          {templateTransactionId ? (
            <Button
              variant="link"
              className="p-0 h-auto text-primary hover:underline"
              onClick={() => router.push(`/transactions/${templateTransactionId}/edit`)}
            >
               {t('templateId')} #{templateTransactionId}
            </Button>
          ) : (
            <span>{t('templateId')} N/A</span>
          )}
        </TableCell>
        <TableCell className="py-3 px-4 align-top text-sm">{getStatusName(def.status)}</TableCell>
        <TableCell className="py-3 px-4 align-top text-sm">{getFrequencyNameById(def.frequency)}</TableCell>
        <TableCell className="py-3 px-4 align-top text-sm">{format(parseISO(def.createdAt), "PP", { locale: dateFnsLocale })}</TableCell>
        <TableCell className="py-3 px-4 align-top text-sm">{format(parseISO(def.nextExecution), "PPp", { locale: dateFnsLocale })}</TableCell>
        <TableCell className="py-3 px-4 align-top text-sm text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isActionLoading}>
                {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                <span className="sr-only">{t('actions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {templateTransactionId && (
                <DropdownMenuItem onSelect={() => router.push(`/transactions/${templateTransactionId}/edit`)} className="flex items-center cursor-pointer">
                  <Edit3 className="mr-2 h-4 w-4" />
                  {t('editTemplateButton')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => handleToggleDefinitionStatus(def)} className="flex items-center cursor-pointer">
                {def.status === 1 ? <PowerOff className="mr-2 h-4 w-4" /> : <Power className="mr-2 h-4 w-4" /> }
                {t('toggleStatusButton')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => openDeleteDefinitionDialog(def)} className="text-destructive focus:text-destructive flex items-center cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4" />
                {t('removeDefinitionButton')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    )});
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="font-headline text-4xl font-bold text-foreground">{t('transactions')}</h1>
          <Button onClick={handleAddNewTransaction} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-5 w-5" />
            {t('addNewTransaction')}
          </Button>
        </div>

        {activeTab === 'all' && (
          <Card>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="filters">
                  <AccordionTrigger className="w-full px-6 py-4 hover:no-underline hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors rounded-t-lg">
                    <div className="flex items-center text-xl font-semibold text-foreground">
                      <ListFilter className="mr-3 h-6 w-6 text-primary" />
                      {t('filterTransactionsTitle')}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-6 space-y-6 bg-background rounded-b-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2">
                          <Label htmlFor="startDate" className="font-medium">{t('startDate')}</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button id="startDate" variant="outline" className="w-full justify-start text-left font-normal hover:border-primary transition-colors">
                                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                {filters.startDate ? format(filters.startDate, "PPP", { locale: dateFnsLocale }) : <span className="text-muted-foreground">{t('selectDate')}</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={filters.startDate} onSelect={(date) => handleFilterChange('startDate', date || undefined)} locale={dateFnsLocale} disabled={disabledStartDate} />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate" className="font-medium">{t('endDate')}</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button id="endDate" variant="outline" className="w-full justify-start text-left font-normal hover:border-primary transition-colors">
                                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                {filters.endDate ? format(filters.endDate, "PPP", { locale: dateFnsLocale }) : <span className="text-muted-foreground">{t('selectDate')}</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={filters.endDate} onSelect={(date) => handleFilterChange('endDate', date || undefined)} locale={dateFnsLocale} disabled={disabledEndDate}/>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="filterCategory" className="font-medium">{t('filterByCategory')}</Label>
                          <CategorySelector
                              value={filters.categoryId}
                              onChange={(value) => handleFilterChange('categoryId', value ?? undefined)}
                              mainCategories={mainCategories}
                              disabled={isLoadingCategories}
                              placeholder={t('selectCategoryPlaceholder')}
                              allowAllCategories={true}
                              triggerClassName="border border-input font-normal hover:border-primary transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="filterType" className="font-medium">{t('filterByType')}</Label>
                          <Select value={filters.typeId || 'all'} onValueChange={(value) => handleFilterChange('typeId', value === 'all' ? undefined : value)} disabled={isLoadingTypes}>
                            <SelectTrigger id="filterType" className={cn("border border-input font-normal hover:border-primary transition-colors")}>
                              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                              <SelectValue placeholder={isLoadingTypes ? t('loading') : t('selectTypePlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">{t('allTypes')}</SelectItem>
                              {transactionTypes && transactionTypes.length > 0 && transactionTypes.map(type => (
                                <SelectItem key={type.id} value={type.id}>
                                  {t(`transactionType_${type.name}` as any, {defaultValue: type.name})}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 pt-0 sm:flex-row sm:justify-end sm:space-x-3">
                        <Button variant="outline" onClick={handleClearFilters} disabled={isLoadingTransactions || isLoadingTypes || isLoadingCategories} className="w-full sm:w-auto">{t('clearFiltersButton')}</Button>
                        <Button onClick={handleApplyFilters} disabled={isLoadingTransactions || isLoadingTypes || isLoadingCategories} className="w-full sm:w-auto">
                          {(isLoadingTransactions && activeTab === 'all') && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {t('applyFiltersButton')}
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value as "all" | "recurring"); setCurrentPage(1); setTotalPages(1); }} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex bg-muted/60 dark:bg-muted/20 p-1.5 rounded-lg">
            <TabsTrigger value="all" className="flex-1 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-150 py-2.5">
              <History className="h-5 w-5" />
              {t('allTransactionsTab')}
            </TabsTrigger>
            <TabsTrigger value="recurring" className="flex-1 gap-2 data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all duration-150 py-2.5">
              <RefreshCwIcon className="h-5 w-5" />
              {t('recurringTransactionsTab')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-foreground">{t('recentTransactionsTitle')}</CardTitle>
                <CardDescription>{t('viewAllYourTransactions')}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30 dark:bg-muted/10">
                      <TableRow>
                        <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('time')}</TableHead>
                        <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs text-center">{t('transactionType')}</TableHead>
                        <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('category')}</TableHead>
                        <TableHead className="hidden lg:table-cell px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('description')}</TableHead>
                        <TableHead className="text-right px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('amount')}</TableHead>
                        <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('wallet')}</TableHead>
                        <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs text-center">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {renderTransactionTableContent()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              {activeTab === 'all' && (
                <CardFooter className="flex items-center justify-center py-4">
                  {isLoadingMore ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : currentPage >= totalPages && rawTransactions.length > 0 ? (
                    <p className="text-sm text-muted-foreground">{t('noMoreTransactionsToLoad')}</p>
                  ) : null}
                  <div ref={loaderRef} className="h-1"></div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
          <TabsContent value="recurring" className="mt-6">
             <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-foreground">{t('recurringTransactionsListTitle')}</CardTitle>
                <CardDescription>{t('manageRecurringDefinitions')}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                   <Table>
                     <TableHeader className="bg-muted/30 dark:bg-muted/10">
                      <TableRow>
                        <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('templateInfo')}</TableHead>
                        <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('status')}</TableHead>
                        <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('frequency')}</TableHead>
                        <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('createdAt')}</TableHead>
                        <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs">{t('nextExecution')}</TableHead>
                        <TableHead className="px-4 py-3 text-muted-foreground uppercase tracking-wider text-xs text-center">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {renderRepeatedDefinitionsTableContent()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <AlertDialog open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTransactionConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteTransactionConfirmMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTransactionForDelete(null)}>{t('cancelButton')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isDeleting ? t('deleting') : t('deleteButtonConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDefinitionDialog} onOpenChange={setShowDeleteDefinitionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmRemoveDefinitionTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmRemoveDefinitionMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedDefinitionForDelete(null)}>{t('cancelButton')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDefinitionConfirmed}
              disabled={definitionActionStates[selectedDefinitionForDelete?.id || '']?.isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {definitionActionStates[selectedDefinitionForDelete?.id || '']?.isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isDeleting ? t('deleting') : t('deleteButtonConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
