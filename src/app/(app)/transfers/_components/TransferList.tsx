
'use client';

import React, { useState } from 'react';
import type { Transfer, Wallet } from '@/lib/definitions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTableActions } from '@/components/shared/DataTableActions';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { deleteTransfer } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowRight, ListChecks } from 'lucide-react';

interface TransferListProps {
  initialTransfers: Transfer[];
  wallets: Wallet[];
  locale: string; // Added locale
  defaultCurrencyCode: string; // Added defaultCurrencyCode for fallback
}

export function TransferList({ initialTransfers, wallets, locale, defaultCurrencyCode }: TransferListProps) {
  const [transfers, setTransfers] = useState<Transfer[]>(initialTransfers);
  const [itemToDelete, setItemToDelete] = useState<Transfer | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const getWalletName = (walletId: string) => wallets.find(w => w.id === walletId)?.name || 'N/A';
  const getWalletCurrency = (walletId: string) => wallets.find(w => w.id === walletId)?.currency || defaultCurrencyCode;


  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteTransfer(itemToDelete.id);
      setTransfers(transfers.filter((t) => t.id !== itemToDelete.id));
      toast({
        title: 'Transfer Deleted',
        description: `Transfer has been successfully deleted.`,
      });
    } catch (error) {
      toast({
        title: 'Error Deleting Transfer',
        description: `Could not delete transfer: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive',
      });
    } finally {
      setItemToDelete(null);
    }
  };

  if (transfers.length === 0) {
    return (
      <div className="text-center py-10">
        <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Transfers Yet</h3>
        <p className="text-muted-foreground">Your transfer history will appear here.</p>
      </div>
    );
  }


  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>From</TableHead>
              <TableHead></TableHead> {/* For arrow icon */}
              <TableHead>To</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.map((transfer) => {
              const currencyCode = getWalletCurrency(transfer.fromWalletId);
              return (
                <TableRow key={transfer.id}>
                  <TableCell>{format(new Date(transfer.createdAt), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{getWalletName(transfer.fromWalletId)}</TableCell>
                  <TableCell><ArrowRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                  <TableCell>{getWalletName(transfer.toWalletId)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{transfer.description || '-'}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {transfer.amount.toLocaleString(locale, { style: 'currency', currency: currencyCode, currencyDisplay: 'code', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DataTableActions
                      onDelete={() => setItemToDelete(transfer)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <DeleteConfirmationDialog
        isOpen={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        onConfirm={handleDelete}
        itemName={`transfer of ${itemToDelete?.amount.toLocaleString(locale, {currency: getWalletCurrency(itemToDelete?.fromWalletId || ''), currencyDisplay:'code', minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
      />
    </>
  );
}
