'use client';

import React, { useState } from 'react';
import type { Transaction, Wallet, SubCategory, MainCategory } from '@/lib/definitions';
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
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { ArrowDownCircle, ArrowUpCircle, ListX } from 'lucide-react';

interface TransactionListProps {
  initialTransactions: Transaction[];
  wallets: Wallet[];
  subCategories: SubCategory[];
  mainCategories: MainCategory[];
}

export function TransactionList({ initialTransactions, wallets, subCategories, mainCategories }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [itemToDelete, setItemToDelete] = useState<Transaction | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const getWalletName = (walletId: string) => wallets.find(w => w.id === walletId)?.name || 'N/A';
  const getCategoryInfo = (subCategoryId: string) => {
    const sub = subCategories.find(sc => sc.id === subCategoryId);
    if (!sub) return { name: 'N/A', color: '#888888', mainCategoryName: 'N/A' };
    const main = mainCategories.find(mc => mc.id === sub.mainCategoryId);
    return { name: sub.name, color: sub.color, mainCategoryName: main?.name || 'N/A' };
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteTransaction(itemToDelete.id);
      setTransactions(transactions.filter((t) => t.id !== itemToDelete.id));
      toast({
        title: 'Transaction Deleted',
        description: `Transaction has been successfully deleted.`,
      });
    } catch (error) {
      toast({
        title: 'Error Deleting Transaction',
        description: `Could not delete transaction: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive',
      });
    } finally {
      setItemToDelete(null);
    }
  };

  if (transactions.length === 0) {
    return (
       <Card className="text-center p-10 shadow">
        <ListX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Transactions Yet</h3>
        <p className="text-muted-foreground">Start by adding your income and expenses.</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description/Category</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const categoryInfo = getCategoryInfo(transaction.subCategoryId);
              return (
                <TableRow key={transaction.id}>
                  <TableCell>{format(new Date(transaction.createdAt), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <div className="font-medium">{transaction.description || categoryInfo.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center">
                       <span className="h-2 w-2 rounded-full mr-1 border" style={{ backgroundColor: categoryInfo.color }}></span>
                       {categoryInfo.mainCategoryName} / {categoryInfo.name}
                    </div>
                  </TableCell>
                  <TableCell>{getWalletName(transaction.walletId)}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === 'Income' ? 'default' : 'destructive'} className={transaction.type === 'Income' ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}>
                      {transaction.type === 'Income' ? <ArrowUpCircle className="mr-1 h-3 w-3" /> : <ArrowDownCircle className="mr-1 h-3 w-3" />}
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${transaction.type === 'Income' ? 'text-accent' : 'text-destructive'}`}>
                    {transaction.amount.toLocaleString(undefined, { style: 'currency', currency: wallets.find(w=>w.id === transaction.walletId)?.currency || 'USD' })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DataTableActions
                      onEdit={() => router.push(`/transactions/edit/${transaction.id}`)}
                      onDelete={() => setItemToDelete(transaction)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
      <DeleteConfirmationDialog
        isOpen={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        onConfirm={handleDelete}
        itemName={`transaction of ${itemToDelete?.amount}`}
      />
    </>
  );
}
