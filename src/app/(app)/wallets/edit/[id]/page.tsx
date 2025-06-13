import { PageHeader } from '@/components/shared/PageHeader';
import { WalletForm } from '../../_components/WalletForm';
import { getWallets, updateWallet } from '@/lib/actions'; // Assuming getWalletById doesn't exist, filter from getWallets
import { notFound } from 'next/navigation';
import type { Wallet } from '@/lib/definitions';

async function getWalletById(id: string): Promise<Wallet | null> {
  const wallets = await getWallets();
  const wallet = wallets.find(w => w.id === id);
  return wallet || null;
}

export default async function EditWalletPage({ params }: { params: { id: string } }) {
  const wallet = await getWalletById(params.id);

  if (!wallet) {
    notFound();
  }

  const handleSubmit = async (data: Omit<Wallet, 'id' | 'userId'>) => {
    'use server';
    return updateWallet(params.id, data);
  };

  return (
    <>
      <PageHeader title="Edit Wallet" description={`Update details for ${wallet.name}.`} />
      <WalletForm initialData={wallet} onSubmitAction={handleSubmit} />
    </>
  );
}
