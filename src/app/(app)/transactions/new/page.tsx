
import { PageHeader } from '@/components/shared/PageHeader';
import { TransactionForm } from '../_components/TransactionForm';
import { createTransaction, getWallets, getSubCategories, getMainCategories, getTransactionTypes } from '@/lib/actions';
import type { Wallet } from '@/lib/definitions'; 
import { getTranslations } from '@/lib/getTranslations';
import { cookies } from 'next/headers';

export default async function NewTransactionPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const t = await getTranslations(locale);
  const tt = t.transactionsPage;

  const wallets = await getWallets();
  const subCategories = await getSubCategories();
  const mainCategories = await getMainCategories();
  const availableTransactionTypes = await getTransactionTypes();

  const mainBankWallet = wallets.find(wallet => wallet.name.toLowerCase().includes('main bank')); // More flexible check
  const defaultWalletId = mainBankWallet?.id;

  if (wallets.length === 0) { 
    return (
      <>
        <PageHeader title={tt.newTransactionTitle} description={tt.newTransactionDescription} />
        <div className="max-w-2xl mx-auto p-6 border rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-semibold mb-2">Cannot Create Transaction</h2>
          <p className="text-muted-foreground">You need to add at least one wallet before creating a transaction.</p>
          {/* TODO: Add links to create wallet */}
        </div>
      </>
    );
  }
  
  return (
    <>
      <PageHeader title={tt.newTransactionTitle} description={tt.newTransactionDescription} />
      <TransactionForm 
        onSubmitAction={createTransaction} 
        wallets={wallets}
        subCategories={subCategories}
        mainCategories={mainCategories}
        defaultWalletId={defaultWalletId} 
        availableTransactionTypes={availableTransactionTypes}
        translations={tt.form} // Pass form-specific translations
      />
    </>
  );
}
