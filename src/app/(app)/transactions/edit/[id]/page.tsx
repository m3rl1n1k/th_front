
import { PageHeader } from '@/components/shared/PageHeader';
import { TransactionForm } from '../../_components/TransactionForm';
import { getTransactions, updateTransaction, getWallets, getSubCategories, getMainCategories, getTransactionTypes } from '@/lib/actions';
import { notFound } from 'next/navigation';
import type { Transaction } from '@/lib/definitions';
import { getTranslations } from '@/lib/getTranslations';
import { cookies } from 'next/headers';
import { format } from 'date-fns';
import { enUS, es, uk } from 'date-fns/locale';

const dateFnsLocales: { [key: string]: any } = {
  en: enUS,
  es: es,
  uk: uk,
};

async function getTransactionById(id: string): Promise<Transaction | null> {
  const transactions = await getTransactions();
  const transaction = transactions.find(t => t.id === id);
  return transaction || null;
}

export default async function EditTransactionPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const t = await getTranslations(locale);
  const tt = t.transactionsPage;

  const transaction = await getTransactionById(params.id);
  const wallets = await getWallets();
  const subCategories = await getSubCategories();
  const mainCategories = await getMainCategories();
  const availableTransactionTypes = await getTransactionTypes();

  if (!transaction) {
    notFound();
  }

  const handleSubmit = async (data: Omit<Transaction, 'id' | 'userId'>) => {
    'use server';
    return updateTransaction(params.id, data);
  };

  const formattedDate = format(new Date(transaction.createdAt), 'PPP', { locale: dateFnsLocales[locale] || enUS });
  const pageDescription = tt.editTransactionDescription.replace('{date}', formattedDate);

  return (
    <>
      <PageHeader title={tt.editTransactionTitle} description={pageDescription} />
      <TransactionForm 
        initialData={transaction} 
        onSubmitAction={handleSubmit} 
        wallets={wallets}
        subCategories={subCategories}
        mainCategories={mainCategories}
        availableTransactionTypes={availableTransactionTypes}
        translations={tt.form} // Pass form-specific translations
      />
    </>
  );
}
