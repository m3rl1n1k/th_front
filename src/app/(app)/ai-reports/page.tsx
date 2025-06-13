
import { PageHeader } from '@/components/shared/PageHeader';
import { FinancialReportDisplay } from './_components/FinancialReportDisplay';
import { getTranslations } from '@/lib/getTranslations';
import { generateFinancialReport } from '../../../ai/flows/financial-report-flow'; // Changed to relative path
import { getCurrentUser } from '@/lib/auth'; // To pass userId if needed, or flow handles it

export default async function AiReportsPage({ /* params: { locale } */ }: { /* params: { locale: string } */ }) {
  const locale = 'en'; // Hardcode locale
  const t = await getTranslations(locale);
  const tar = t.aiReportsPage;
  // const currentUser = await getCurrentUser(); // If userId is needed for the flow

  const handleGenerateReport = async () => {
    'use server';
    // If your flow needs userId explicitly:
    // const user = await getCurrentUser();
    // if (!user) throw new Error("User not authenticated");
    // return generateFinancialReport({ userId: user.id });
    return generateFinancialReport({}); // Assuming flow gets user contextually or doesn't need ID
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
