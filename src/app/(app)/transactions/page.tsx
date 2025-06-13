
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { TransactionList } from './_components/TransactionList';
import { getTransactions, getWallets, getSubCategories, getMainCategories } from '@/lib/actions';

export default async function TransactionsPage() {
  const transactions = await getTransactions();
  const wallets = await getWallets();
  const subCategories = await getSubCategories();
  const mainCategories = await getMainCategories(); // Needed to map subCategory to mainCategory for display

  return (
    <>
      <PageHeader title="Transactions" description="Track your income and expenses.">
        <Button asChild>
          <Link href="/transactions/new"> {/* Non-prefixed link */}
            <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
          </Link>
        </Button>
      </PageHeader>
      <TransactionList 
        initialTransactions={transactions} 
        wallets={wallets}
        subCategories={subCategories}
        mainCategories={mainCategories}
      />
    </>
  );
}
