
import { PageHeader } from '@/components/shared/PageHeader';
import { getCurrentUser } from '@/lib/auth';
import { updateUserProfile } from '@/lib/actions';
import type { User } from '@/lib/definitions';
import { ProfileForm } from './_components/ProfileForm';
import { getTranslations } from '@/lib/getTranslations';
import { redirect } from 'next/navigation';

export default async function ProfilePage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations(locale);
  const tp = t.profilePage; // Translations for profile page

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    // This should ideally not happen if middleware is correctly protecting routes
    redirect(`/${locale}/login`);
  }
  
  const handleUpdateProfile = async (data: { name?: string }) => {
    'use server';
    // The updateUserProfile action expects userId as the first argument.
    // We get it from the currentUser object fetched on this server component.
    return updateUserProfile(currentUser.id, data);
  };

  return (
    <>
      <PageHeader title={tp.title} description={tp.description} />
      <ProfileForm 
        initialData={currentUser} 
        onSubmitAction={handleUpdateProfile}
        translations={tp}
      />
    </>
  );
}
