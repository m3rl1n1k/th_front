
import { PageHeader } from '@/components/shared/PageHeader';
import { TransactionForm } from '../../_components/TransactionForm';
import { getTransactions, updateTransaction, getWallets, getSubCategories, getMainCategories, getTransactionTypes } from '@/lib/actions'; // Added getTransactionTypes
import { notFound } from 'next/navigation';
import type { Transaction } from '@/lib/definitions';

async function getTransactionById(id: string): Promise<Transaction | null> {
  const transactions = await getTransactions();
  const transaction = transactions.find(t => t.id === id);
  return transaction || null;
}

export default async function EditTransactionPage({ params }: { params: { id: string } }) {
  const transaction = await getTransactionById(params.id);
  const wallets = await getWallets();
  const subCategories = await getSubCategories();
  const mainCategories = await getMainCategories();
  const availableTransactionTypes = await getTransactionTypes(); // Fetch types

  if (!transaction) {
    notFound();
  }

  const handleSubmit = async (data: Omit<Transaction, 'id' | 'userId'>) => {
    'use server';
    return updateTransaction(params.id, data);
  };

  return (
    <>
      <PageHeader title="Edit Transaction" description={`Update details for transaction on ${new Date(transaction.createdAt).toLocaleDateString()}.`} />
      <TransactionForm 
        initialData={transaction} 
        onSubmitAction={handleSubmit} 
        wallets={wallets}
        subCategories={subCategories}
        mainCategories={mainCategories}
        availableTransactionTypes={availableTransactionTypes} // Pass types
      />
    </>
  );
}
