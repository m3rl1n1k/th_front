
import { PageHeader } from '@/components/shared/PageHeader';
import { getTransfers, getWallets, getUserSettings } from '@/lib/actions';
import { TransferForm } from './_components/TransferForm';
import { TransferList } from './_components/TransferList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cookies } from 'next/headers';

export default async function TransfersPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const userSettings = await getUserSettings();
  const defaultCurrency = userSettings?.defaultCurrency || 'USD';

  const transfers = await getTransfers();
  const wallets = await getWallets();

  return (
    <>
      <PageHeader title="Transfers" description="Move funds between your wallets." />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <TransferForm wallets={wallets} />
        </div>
        <div className="lg:col-span-2">
           <Card className="shadow-lg">
             <CardHeader>
               <CardTitle className="font-headline">Transfer History</CardTitle>
             </CardHeader>
             <CardContent>
                <TransferList 
                  initialTransfers={transfers} 
                  wallets={wallets} 
                  locale={locale}
                  defaultCurrencyCode={defaultCurrency}
                />
             </CardContent>
           </Card>
        </div>
      </div>
    </>
  );
}
