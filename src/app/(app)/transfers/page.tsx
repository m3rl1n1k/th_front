
import { PageHeader } from '@/components/shared/PageHeader';
import { getTransfers, getWallets } from '@/lib/actions';
import { TransferForm } from './_components/TransferForm';
import { TransferList } from './_components/TransferList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function TransfersPage() {
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
                <TransferList initialTransfers={transfers} wallets={wallets} />
             </CardContent>
           </Card>
        </div>
      </div>
    </>
  );
}
