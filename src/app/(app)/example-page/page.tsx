
import { PageHeader } from '@/components/shared/PageHeader';
import { getTranslations } from '@/lib/getTranslations';
import { cookies } from 'next/headers';

export default async function ExamplePage() {
  const cookieStore = cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const t = await getTranslations(locale);
  const tep = t.examplePage; // Assuming 'examplePage' namespace in translations

  return (
    <>
      <PageHeader title={tep.title} description={tep.description} />
      <div className="p-4 border rounded-lg shadow-sm bg-card">
        <p>This is the content for the Example Page.</p>
        <p>You can replace this with the actual content for your new page.</p>
      </div>
    </>
  );
}
