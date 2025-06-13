
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { TransactionList } from './_components/TransactionList';
import { RecurringTransactionList } from './_components/RecurringTransactionList';
import { getTransactions, getWallets, getSubCategories, getMainCategories } from '@/lib/actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTranslations } from '@/lib/getTranslations';
import { cookies } from 'next/headers'; 

export default async function TransactionsPage() {
  const cookieStore = cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const t = await getTranslations(locale);
  const tt = t.transactionsPage || {
    allTransactionsTab: "All Transactions",
    recurringTransactionsTab: "Recurring",
    addTransactionButton: "Add Transaction",
    title: "Transactions",
    description: "Track your income and expenses.",
    filters: {}, // Ensure filters key exists
    uncategorized: "Uncategorized",
    income: "Income",
    expense: "Expense",
    dateToday: "Today",
    dateYesterday: "Yesterday"
  };

  const allTransactions = await getTransactions();
  const wallets = await getWallets();
  const subCategories = await getSubCategories();
  const mainCategories = await getMainCategories();

  const recurringTransactions = allTransactions.filter(tx => tx.frequency !== 'One-time');

  return (
    <>
      <PageHeader title={tt.title} description={tt.description}>
        <Button asChild>
          <Link href={`/${locale}/transactions/new`}>
            <PlusCircle className="mr-2 h-4 w-4" /> {tt.addTransactionButton}
          </Link>
        </Button>
      </PageHeader>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">{tt.allTransactionsTab}</TabsTrigger>
          <TabsTrigger value="recurring">{tt.recurringTransactionsTab}</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <TransactionList
            initialTransactions={allTransactions}
            wallets={wallets}
            subCategories={subCategories}
            mainCategories={mainCategories}
            translations={tt} // Pass the whole transactionsPage translations
            locale={locale}
          />
        </TabsContent>
        <TabsContent value="recurring">
          <RecurringTransactionList
            initialTransactions={recurringTransactions}
            wallets={wallets}
            subCategories={subCategories}
            mainCategories={mainCategories}
            translations={tt}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
