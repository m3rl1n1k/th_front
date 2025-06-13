
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { WalletList } from './_components/WalletList';
import { getWallets } from '@/lib/actions';

export default async function WalletsPage() {
  const wallets = await getWallets();

  return (
    <>
      <PageHeader title="Wallets" description="Manage your financial accounts and cash.">
        <Button asChild>
          <Link href="/wallets/new"> {/* Non-prefixed link */}
            <PlusCircle className="mr-2 h-4 w-4" /> Add Wallet
          </Link>
        </Button>
      </PageHeader>
      <WalletList initialWallets={wallets} />
    </>
  );
}
