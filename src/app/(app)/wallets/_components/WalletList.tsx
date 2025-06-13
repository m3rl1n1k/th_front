
'use client';

import React, { useState } from 'react';
import type { Wallet } from '@/lib/definitions';
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
import { deleteWallet } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Wallet as WalletIcon, CircleDollarSign, Landmark, CreditCardIcon, Smartphone } from 'lucide-react';

const WalletTypeIcon = ({ type }: { type: Wallet['type'] }) => {
  switch (type) {
    case 'Bank Account':
      return <Landmark className="h-4 w-4 mr-2 text-muted-foreground" />;
    case 'Cash':
      return <CircleDollarSign className="h-4 w-4 mr-2 text-muted-foreground" />;
    case 'Credit Card':
      return <CreditCardIcon className="h-4 w-4 mr-2 text-muted-foreground" />;
    case 'E-Wallet':
      return <Smartphone className="h-4 w-4 mr-2 text-muted-foreground" />;
    default:
      return <WalletIcon className="h-4 w-4 mr-2 text-muted-foreground" />;
  }
};

interface WalletListProps {
  initialWallets: Wallet[];
  locale: string; // Added locale
}

export function WalletList({ initialWallets, locale }: WalletListProps) {
  const [wallets, setWallets] = useState<Wallet[]>(initialWallets);
  const [itemToDelete, setItemToDelete] = useState<Wallet | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteWallet(itemToDelete.id);
      setWallets(wallets.filter((w) => w.id !== itemToDelete.id));
      toast({
        title: 'Wallet Deleted',
        description: `Wallet "${itemToDelete.name}" has been successfully deleted.`,
      });
    } catch (error) {
      toast({
        title: 'Error Deleting Wallet',
        description: `Could not delete wallet: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive',
      });
    } finally {
      setItemToDelete(null);
    }
  };
  
  if (wallets.length === 0) {
    return (
      <Card className="text-center p-10 shadow">
        <WalletIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Wallets Yet</h3>
        <p className="text-muted-foreground">Get started by adding your first wallet.</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="text-right">Initial Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wallets.map((wallet) => (
              <TableRow key={wallet.id}>
                <TableCell className="font-medium flex items-center">
                  <WalletTypeIcon type={wallet.type} />
                  {wallet.name}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{wallet.type}</Badge>
                </TableCell>
                <TableCell>{wallet.currency}</TableCell>
                <TableCell className="text-right">
                  {wallet.initialAmount.toLocaleString(locale, { style: 'currency', currency: wallet.currency, currencyDisplay: 'code', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right">
                  <DataTableActions
                    onEdit={() => router.push(`/wallets/edit/${wallet.id}`)}
                    onDelete={() => setItemToDelete(wallet)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <DeleteConfirmationDialog
        isOpen={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
        onConfirm={handleDelete}
        itemName={itemToDelete?.name}
      />
    </>
  );
}
