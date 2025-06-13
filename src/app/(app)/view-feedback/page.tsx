
import { PageHeader } from '@/components/shared/PageHeader';
import { getFeedbacks } from '@/lib/actions';
import { getTranslations } from '@/lib/getTranslations';
import { cookies } from 'next/headers';
import { FeedbackDisplay } from './_components/FeedbackDisplay';
import type { FeedbackItem, FeedbackType } from '@/lib/definitions';
import { feedbackTypes } from '@/lib/definitions'; // Import feedbackTypes

export default async function ViewFeedbackPage() {
  const cookieStore = cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const t = await getTranslations(locale);
  const tvf = t.viewFeedbackPage;

  const allFeedbacks: FeedbackItem[] = await getFeedbacks();

  // Prepare feedback grouped by type
  const groupedFeedbacks: { type: FeedbackType; feedbacks: FeedbackItem[] }[] = feedbackTypes.map(ft => ({
    type: ft,
    feedbacks: allFeedbacks.filter(item => item.feedbackType === ft)
                           .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Sort by date within group
  })).filter(group => group.feedbacks.length > 0); // Only include types with feedback

  return (
    <>
      <PageHeader title={tvf.title} description={tvf.description} />
      {allFeedbacks.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">{tvf.noFeedback}</p>
        </div>
      ) : (
        <FeedbackDisplay 
          groupedFeedbacks={groupedFeedbacks} 
          translations={tvf} 
          locale={locale} 
        />
      )}
    </>
  );
}
