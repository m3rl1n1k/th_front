
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Transaction, Wallet, SubCategory, MainCategory, TransactionType } from '@/lib/definitions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DataTableActions } from '@/components/shared/DataTableActions';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { deleteTransaction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { format, isToday, isYesterday, parseISO, startOfDay, compareDesc } from 'date-fns';
import { enUS, es } from 'date-fns/locale'; 
import type { Locale } from 'date-fns'; 
import { Card } from '@/components/ui/card';
import { ArrowDownCircle, ArrowUpCircle, ListX } from 'lucide-react';
import { TransactionFilters, type TransactionFiltersState } from './TransactionFilters';

const ALL_VALUE = '_ALL_';
const UNCAT_VALUE = '_UNCATEGORIZED_';

interface TransactionListProps {
  initialTransactions: Transaction[];
  wallets: Wallet[];
  subCategories: SubCategory[];
  mainCategories: MainCategory[];
  translations: any;
  locale: string;
  defaultCurrencyCode: string; // Added defaultCurrencyCode
}

interface GroupedTransactions {
  dateDisplay: string;
  dateActual: Date;
  transactions: Transaction[];
}

const dateFnsLocalesMap: { [key: string]: Locale } = {
  en: enUS,
  es: es,
};

export function TransactionList({
  initialTransactions,
  wallets,
  subCategories,
  mainCategories,
  translations,
  locale,
  defaultCurrencyCode, // Use defaultCurrencyCode
}: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [itemToDelete, setItemToDelete] = useState<Transaction | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const dateLocaleForFormatting = dateFnsLocalesMap[locale] || enUS;

  const initialFilterState: TransactionFiltersState = {
    type: ALL_VALUE,
    walletId: ALL_VALUE,
    subCategoryId: ALL_VALUE,
    startDate: null,
    endDate: null,
    searchTerm: '',
  };
  const [activeFilters, setActiveFilters] = useState<TransactionFiltersState>(initialFilterState);

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const lowerCaseSearchTerm = activeFilters.searchTerm.toLowerCase();
      const descriptionMatch = transaction.description?.toLowerCase().includes(lowerCaseSearchTerm) || 
                                 getCategoryInfo(transaction.subCategoryId).name.toLowerCase().includes(lowerCaseSearchTerm) ||
                                 getCategoryInfo(transaction.subCategoryId).mainCategoryName.toLowerCase().includes(lowerCaseSearchTerm);

      if (activeFilters.searchTerm && !descriptionMatch) return false;
      if (activeFilters.type !== ALL_VALUE && transaction.type !== activeFilters.type) return false;
      if (activeFilters.walletId !== ALL_VALUE && transaction.walletId !== activeFilters.walletId) return false;
      
      if (activeFilters.subCategoryId === UNCAT_VALUE && transaction.subCategoryId) return false;
      if (activeFilters.subCategoryId !== ALL_VALUE && activeFilters.subCategoryId !== UNCAT_VALUE && transaction.subCategoryId !== activeFilters.subCategoryId) {
        const subCat = subCategories.find(sc => sc.id === transaction.subCategoryId);
        if (activeFilters.subCategoryId && mainCategories.some(mc => mc.id === activeFilters.subCategoryId)) {
             if (!subCat || subCat.mainCategoryId !== activeFilters.subCategoryId) return false;
        } else if (transaction.subCategoryId !== activeFilters.subCategoryId) {
            return false;
        }
      }

      const transactionDate = startOfDay(new Date(transaction.createdAt));
      if (activeFilters.startDate && transactionDate < startOfDay(activeFilters.startDate)) return false;
      if (activeFilters.endDate && transactionDate > startOfDay(activeFilters.endDate)) return false;
      
      return true;
    });
  }, [transactions, activeFilters, subCategories, mainCategories]);

  const getWalletName = (walletId: string) => wallets.find(w => w.id === walletId)?.name || 'N/A';
  
  const getCategoryInfo = (subCategoryId?: string) => {
    if (!subCategoryId) {
      return { name: translations?.uncategorized || 'Uncategorized', color: 'hsl(var(--muted-foreground))', mainCategoryName: 'N/A' };
    }
    const sub = subCategories.find(sc => sc.id === subCategoryId);
    if (!sub) return { name: 'N/A', color: 'hsl(var(--muted-foreground))', mainCategoryName: 'N/A' };
    const main = mainCategories.find(mc => mc.id === sub.mainCategoryId);
    return { name: sub.name, color: sub.color, mainCategoryName: main?.name || 'N/A' };
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteTransaction(itemToDelete.id);
      setTransactions(prev => prev.filter((t) => t.id !== itemToDelete.id));
      toast({
        title: translations?.deleteSuccessToastTitle || 'Transaction Deleted',
        description: translations?.deleteSuccessToastDescription || 'Transaction has been successfully deleted.',
      });
    } catch (error) {
      toast({
        title: translations?.errorToastTitle || 'Error Deleting Transaction',
        description: `${translations?.errorToastDescription?.replace('{error}', error instanceof Error ? error.message : String(error)) || (error instanceof Error ? error.message : String(error))}`,
        variant: 'destructive',
      });
    } finally {
      setItemToDelete(null);
    }
  };

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    const sortedTransactions = [...filteredTransactions].sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)));

    sortedTransactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      let dateKey: string;
      if (isToday(date)) {
        dateKey = 'Today';
      } else if (isYesterday(date)) {
        dateKey = 'Yesterday';
      } else {
        dateKey = format(date, 'MMMM dd, yyyy', { locale: dateLocaleForFormatting });
      }
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
    });

    return Object.entries(groups).map(([dateDisplay, transactions]) => {
        let dateActual: Date;
        if (dateDisplay === 'Today') dateActual = new Date();
        else if (dateDisplay === 'Yesterday') dateActual = new Date(new Date().setDate(new Date().getDate() -1));
        else dateActual = transactions[0] ? new Date(transactions[0].createdAt) : new Date(0);
        return { dateDisplay, dateActual, transactions };
    }).sort((a,b) => compareDesc(a.dateActual, b.dateActual));

  }, [filteredTransactions, dateLocaleForFormatting]);

  return (
    <>
      <TransactionFilters
        wallets={wallets}
        subCategories={subCategories}
        mainCategories={mainCategories}
        onApplyFilters={setActiveFilters}
        initialFilters={initialFilterState}
        translations={translations?.filters || {}}
        locale={locale}
      />
      {groupedTransactions.length === 0 ? (
         <Card className="text-center p-10 shadow mt-6">
          <ListX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">{translations?.noTransactionsTitle || 'No Transactions Found'}</h3>
          <p className="text-muted-foreground">{translations?.noTransactionsDescription || 'Try adjusting your filters or adding new transactions.'}</p>
        </Card>
      ) : (
        <Card className="shadow-lg mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translations?.descriptionCategoryHeader || 'Description/Category'}</TableHead>
                <TableHead>{translations?.walletHeader || 'Wallet'}</TableHead>
                <TableHead>{translations?.typeHeader || 'Type'}</TableHead>
                <TableHead className="text-right">{translations?.amountHeader || 'Amount'}</TableHead>
                <TableHead className="text-right">{translations?.actionsHeader || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedTransactions.map((group, groupIndex) => (
                <React.Fragment key={group.dateDisplay + groupIndex}>
                  <TableRow className="bg-muted/50 hover:bg-muted/50 sticky top-0 z-10">
                    <TableCell colSpan={5} className="py-2 px-4 font-semibold text-foreground">
                      {group.dateDisplay === 'Today' ? translations?.dateToday || 'Today' 
                       : group.dateDisplay === 'Yesterday' ? translations?.dateYesterday || 'Yesterday'
                       : group.dateDisplay}
                    </TableCell>
                  </TableRow>
                  {group.transactions.map((transaction) => {
                    const categoryInfo = getCategoryInfo(transaction.subCategoryId);
                    const walletCurrency = wallets.find(w => w.id === transaction.walletId)?.currency || defaultCurrencyCode;
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="font-medium">{transaction.description || categoryInfo.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center">
                             <span className="h-2 w-2 rounded-full mr-1 border" style={{ backgroundColor: categoryInfo.color }}></span>
                             {categoryInfo.mainCategoryName === 'N/A' && categoryInfo.name === (translations?.uncategorized || 'Uncategorized') ? (translations?.uncategorized || 'Uncategorized') : `${categoryInfo.mainCategoryName} / ${categoryInfo.name}`}
                          </div>
                        </TableCell>
                        <TableCell>{getWalletName(transaction.walletId)}</TableCell>
                        <TableCell>
                          <Badge variant={transaction.type === 'Income' ? 'default' : 'destructive'} className={transaction.type === 'Income' ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}>
                            {transaction.type === 'Income' ? <ArrowUpCircle className="mr-1 h-3 w-3" /> : <ArrowDownCircle className="mr-1 h-3 w-3" />}
                            {translations?.[transaction.type.toLowerCase() as keyof typeof translations] || transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${transaction.type === 'Income' ? 'text-accent' : 'text-destructive'}`}>
                          {transaction.amount.toLocaleString(locale, { style: 'currency', currency: walletCurrency, currencyDisplay: 'code', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DataTableActions
                            onEdit={() => router.push(`/${locale}/transactions/edit/${transaction.id}`)}
                            onDelete={() => setItemToDelete(transaction)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      <DeleteConfirmationDialog
        isOpen={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        onConfirm={handleDelete}
        itemName={`${translations?.deleteItemNamePrefix || 'transaction of'} ${itemToDelete?.amount}`}
      />
    </>
  );
}
