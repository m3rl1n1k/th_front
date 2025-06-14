
import { PageHeader } from '@/components/shared/PageHeader';
import { WalletForm } from '../_components/WalletForm';
import { createWallet, getWalletTypes } from '@/lib/actions'; // Added getWalletTypes

export default async function NewWalletPage() {
  const availableWalletTypes = await getWalletTypes();

  return (
    <>
      <PageHeader title="Create New Wallet" description="Add a new financial account or cash source." />
      <WalletForm 
        onSubmitAction={createWallet} 
        availableWalletTypes={availableWalletTypes} 
      />
    </>
  );
}
