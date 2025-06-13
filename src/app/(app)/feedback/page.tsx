
import { PageHeader } from '@/components/shared/PageHeader';
import { FeedbackForm } from './_components/FeedbackForm';
import { getTranslations } from '@/lib/getTranslations';
import { getCurrentUser } from '@/lib/auth';
import { cookies } from 'next/headers'; // Import cookies

export default async function FeedbackPage() {
  const cookieStore = cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
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
