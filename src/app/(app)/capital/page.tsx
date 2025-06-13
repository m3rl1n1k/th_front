
import { PageHeader } from '@/components/shared/PageHeader';
import { getWallets, getSharedCapitalSession } from '@/lib/actions';
import { getTranslations } from '@/lib/getTranslations';
import { CapitalDisplay } from './_components/CapitalDisplay';
import type { Wallet, SharedCapitalSession } from '@/lib/definitions';

export default async function CapitalPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations(locale);
  const tc = t.capitalPage;

  const wallets: Wallet[] = await getWallets();
  const sharedCapitalSession: SharedCapitalSession | null = await getSharedCapitalSession();

  let totalCapitalByCurrency: Record<string, number> = {};
  wallets.forEach(wallet => {
    if (totalCapitalByCurrency[wallet.currency]) {
      totalCapitalByCurrency[wallet.currency] += wallet.initialAmount;
    } else {
      totalCapitalByCurrency[wallet.currency] = wallet.initialAmount;
    }
  });

  return (
    <>
      <PageHeader title={tc.title} description={tc.description} />
      <CapitalDisplay
        wallets={wallets}
        totalCapitalByCurrency={totalCapitalByCurrency}
        initialSession={sharedCapitalSession}
        translations={tc}
        locale={locale}
      />
    </>
  );
}
