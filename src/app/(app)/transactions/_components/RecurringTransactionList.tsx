
'use client';

import React, { useState } from 'react';
import type { Transaction, Wallet, SubCategory, MainCategory, TransactionFrequency } from '@/lib/definitions';
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
import { stopRecurringTransaction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { format, addDays, addWeeks, addMonths, addYears, isPast } from 'date-fns';
import { Card } from '@/components/ui/card';
import { ListX, RepeatIcon } from 'lucide-react';

interface RecurringTransactionListProps {
  initialTransactions: Transaction[];
  wallets: Wallet[];
  subCategories: SubCategory[];
  mainCategories: MainCategory[];
  translations: any; // From transactionsPage namespace
}

export function RecurringTransactionList({
  initialTransactions,
  wallets,
  subCategories,
  mainCategories,
  translations,
}: RecurringTransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions.filter(t => t.frequency !== 'One-time'));
  const [itemToStop, setItemToStop] = useState<Transaction | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const getWalletName = (walletId: string) => wallets.find(w => w.id === walletId)?.name || 'N/A';
  const getWalletCurrency = (walletId: string) => wallets.find(w => w.id === walletId)?.currency || 'USD';

  const getCategoryInfo = (subCategoryId?: string) => {
    if (!subCategoryId) {
      return { name: translations.uncategorized || 'Uncategorized', color: 'hsl(var(--muted-foreground))', mainCategoryName: 'N/A' };
    }
    const sub = subCategories.find(sc => sc.id === subCategoryId);
    if (!sub) return { name: 'N/A', color: 'hsl(var(--muted-foreground))', mainCategoryName: 'N/A' };
    const main = mainCategories.find(mc => mc.id === sub.mainCategoryId);
    return { name: sub.name, color: sub.color, mainCategoryName: main?.name || 'N/A' };
  };

  const calculateNextOccurrence = (createdAt: Date, frequency: TransactionFrequency): Date => {
    let nextDate = new Date(createdAt);
    const today = new Date();
    today.setHours(0,0,0,0); // Normalize today to the start of the day

    if (frequency === 'One-time') return nextDate; // Should not happen for this list

    // Ensure the seed date (nextDate) isn't in the future beyond what's reasonable.
    // If createdAt is already in the future, that's the next date.
    if (nextDate > today && isPast(createdAt)) {
       // if createdAt is in the past, but somehow nextDate based on it is future (e.g. yearly), this is fine
    } else if (nextDate > today) {
        return nextDate;
    }


    while (nextDate < today) {
      switch (frequency) {
        case 'Daily':
          nextDate = addDays(nextDate, 1);
          break;
        case 'Weekly':
          nextDate = addWeeks(nextDate, 1);
          break;
        case 'Monthly':
          nextDate = addMonths(nextDate, 1);
          break;
        case 'Yearly':
          nextDate = addYears(nextDate, 1);
          break;
        default: // Should not happen
          return nextDate;
      }
    }
    return nextDate;
  };

  const handleStopRecurring = async () => {
    if (!itemToStop) return;
    try {
      await stopRecurringTransaction(itemToStop.id);
      setTransactions(transactions.filter((t) => t.id !== itemToStop.id)); // Remove from this list
      toast({
        title: translations.stopRecurringSuccessTitle || 'Recurring Transaction Stopped',
        description: translations.stopRecurringSuccessDescription || `The transaction will no longer recur.`,
      });
      router.refresh(); // To update "All Transactions" list if needed
    } catch (error) {
      toast({
        title: translations.stopRecurringErrorTitle || 'Error Stopping Recurrence',
        description: `${translations.errorToastDescription?.replace('{error}', error instanceof Error ? error.message : String(error)) || (error instanceof Error ? error.message : String(error))}`,
        variant: 'destructive',
      });
    } finally {
      setItemToStop(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <Card className="text-center p-10 shadow">
        <ListX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">{translations.noRecurringTransactionsTitle || 'No Recurring Transactions'}</h3>
        <p className="text-muted-foreground">{translations.noRecurringTransactionsDescription || 'Transactions set to daily, weekly, monthly, or yearly will appear here.'}</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{translations.descriptionCategoryHeader || 'Description/Category'}</TableHead>
              <TableHead>{translations.amountHeader || 'Amount'}</TableHead>
              <TableHead>{translations.frequencyHeader || 'Frequency'}</TableHead>
              <TableHead>{translations.nextExecutionDateHeader || 'Next Execution'}</TableHead>
              <TableHead>{translations.walletHeader || 'Wallet'}</TableHead>
              <TableHead className="text-right">{translations.actionsHeader || 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const categoryInfo = getCategoryInfo(transaction.subCategoryId);
              const nextOccurrence = calculateNextOccurrence(new Date(transaction.createdAt), transaction.frequency);
              return (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="font-medium">{transaction.description || categoryInfo.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                      <span className="h-2 w-2 rounded-full mr-1 border" style={{ backgroundColor: categoryInfo.color }}></span>
                      {categoryInfo.mainCategoryName === 'N/A' && categoryInfo.name === (translations.uncategorized || 'Uncategorized') ? (translations.uncategorized || 'Uncategorized') : `${categoryInfo.mainCategoryName} / ${categoryInfo.name}`}
                    </div>
                  </TableCell>
                  <TableCell className={`font-semibold ${transaction.type === 'Income' ? 'text-accent' : 'text-destructive'}`}>
                    {transaction.amount.toLocaleString(undefined, { style: 'currency', currency: getWalletCurrency(transaction.walletId) })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center">
                      <RepeatIcon className="mr-1 h-3 w-3" />
                      {transaction.frequency}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(nextOccurrence, 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{getWalletName(transaction.walletId)}</TableCell>
                  <TableCell className="text-right">
                    <DataTableActions
                      onEdit={() => router.push(`/transactions/edit/${transaction.id}`)}
                      onDelete={() => setItemToStop(transaction)} // Using onDelete slot for "Stop Recurring"
                      deleteDisabled={false} // Ensure enabled
                      // Custom labels for DataTableActions might be needed or use tooltip
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
      <DeleteConfirmationDialog
        isOpen={!!itemToStop}
        onOpenChange={(open) => !open && setItemToStop(null)}
        onConfirm={handleStopRecurring}
        itemName={`${translations.recurringItemNamePrefix || 'recurring transaction for'} ${itemToStop?.description || getCategoryInfo(itemToStop?.subCategoryId).name}`}
      />
    </>
  );
}
