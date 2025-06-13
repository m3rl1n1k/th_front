import { PageHeader } from '@/components/shared/PageHeader';
import { TransactionForm } from '../_components/TransactionForm';
import { createTransaction, getWallets, getSubCategories, getMainCategories } from '@/lib/actions';

export default async function NewTransactionPage() {
  const wallets = await getWallets();
  const subCategories = await getSubCategories();
  const mainCategories = await getMainCategories();

  if (wallets.length === 0 || subCategories.length === 0) {
    return (
      <>
        <PageHeader title="Create New Transaction" description="Record a new income or expense." />
        <div className="max-w-2xl mx-auto p-6 border rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-semibold mb-2">Cannot Create Transaction</h2>
          {wallets.length === 0 && <p className="text-muted-foreground">You need to add at least one wallet before creating a transaction.</p>}
          {subCategories.length === 0 && <p className="text-muted-foreground mt-2">You need to add at least one sub-category before creating a transaction.</p>}
          {/* TODO: Add links to create wallet/category */}
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
      />
    </>
  );
}
