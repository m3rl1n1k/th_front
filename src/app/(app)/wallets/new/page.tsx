import { PageHeader } from '@/components/shared/PageHeader';
import { WalletForm } from '../_components/WalletForm';
import { createWallet } from '@/lib/actions';

export default function NewWalletPage() {
  return (
    <>
      <PageHeader title="Create New Wallet" description="Add a new financial account or cash source." />
      <WalletForm onSubmitAction={createWallet} />
    </>
  );
}
