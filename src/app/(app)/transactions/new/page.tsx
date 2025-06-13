
import { PageHeader } from '@/components/shared/PageHeader';
import { TransactionForm } from '../_components/TransactionForm';
import { createTransaction, getWallets, getSubCategories, getMainCategories } from '@/lib/actions';
import type { Wallet } from '@/lib/definitions'; // Import Wallet type

export default async function NewTransactionPage() {
  const wallets = await getWallets();
  const subCategories = await getSubCategories();
  const mainCategories = await getMainCategories();

  // Find the "Main Bank" wallet to pass as default
  const mainBankWallet = wallets.find(wallet => wallet.name.toLowerCase() === 'main bank');
  const defaultWalletId = mainBankWallet?.id;

  if (wallets.length === 0) { // Changed condition to only check for wallets
    return (
      <>
        <PageHeader title="Create New Transaction" description="Record a new income or expense." />
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
      <PageHeader title="Create New Transaction" description="Record a new income or expense." />
      <TransactionForm 
        onSubmitAction={createTransaction} 
        wallets={wallets}
        subCategories={subCategories}
        mainCategories={mainCategories}
        defaultWalletId={defaultWalletId} // Pass the defaultWalletId
      />
    </>
  );
}
