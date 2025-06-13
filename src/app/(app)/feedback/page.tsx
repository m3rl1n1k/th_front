
import { PageHeader } from '@/components/shared/PageHeader';
import { FeedbackForm } from './_components/FeedbackForm';
import { getTranslations } from '@/lib/getTranslations';
import { getCurrentUser } from '@/lib/auth';

export default async function FeedbackPage({ /* params: { locale } */ }: { /* params: { locale: string } */ }) {
  const locale = 'en'; // Hardcode locale
  const t = await getTranslations(locale);
  const tf = t.feedbackPage;
  const currentUser = await getCurrentUser();

  return (
    <>
      <PageHeader title={tf.title} description={tf.description} />
      <FeedbackForm translations={tf} currentUserEmail={currentUser?.email} />
    </>
  );
}
