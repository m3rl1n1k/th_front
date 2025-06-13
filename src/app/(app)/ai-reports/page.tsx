
import { PageHeader } from '@/components/shared/PageHeader';
import { FinancialReportDisplay } from './_components/FinancialReportDisplay';
import { getTranslations } from '@/lib/getTranslations';
import { generateFinancialReport } from '../../../ai/flows/financial-report-flow';
import { getCurrentUser } from '@/lib/auth';
import { cookies } from 'next/headers'; // Import cookies

export default async function AiReportsPage() {
  const cookieStore = cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const t = await getTranslations(locale);
  const tar = t.aiReportsPage;

  const handleGenerateReport = async () => {
    'use server';
    return generateFinancialReport({});
  };

  return (
    <>
      <PageHeader title={tar.title} description={tar.description} />
      <FinancialReportDisplay 
        onGenerateReport={handleGenerateReport} 
        translations={tar} 
      />
    </>
  );
}
