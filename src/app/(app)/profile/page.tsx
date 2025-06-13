
import { PageHeader } from '@/components/shared/PageHeader';
import { getCurrentUser } from '@/lib/auth';
import { updateUserProfile, updateUserSettings, getUserSettings } from '@/lib/actions';
import type { User, UserSettings } from '@/lib/definitions';
import { ProfileForm } from './_components/ProfileForm';
import { ChangePasswordForm } from './_components/ChangePasswordForm';
import { getTranslations } from '@/lib/getTranslations';
import { redirect } from 'next/navigation';

export default async function ProfilePage({ /* params: { locale } */ }: { /* params: { locale: string } */ }) {
  const locale = 'en'; // Hardcode locale
  const t = await getTranslations(locale);
  const tp = t.profilePage; 

  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    redirect('/login'); // Redirect to non-prefixed login
  }
  const userSettings = await getUserSettings();

  const handleUpdateProfile = async (data: { name?: string }) => {
    'use server';
    return updateUserProfile(currentUser.id, data);
  };

  const handleUpdateSettings = async (data: { defaultCurrency?: string }) => {
    'use server';
    const currentSettings = await getUserSettings() || { transactionsPerPage: 10 }; 
    const newSettings = { ...currentSettings, ...data };
    return updateUserSettings(newSettings as UserSettings);
  };

  return (
    <>
      <PageHeader title={tp.title} description={tp.description} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProfileForm 
          initialData={currentUser} 
          initialSettings={userSettings}
          onSubmitUserAction={handleUpdateProfile}
          onSubmitSettingsAction={handleUpdateSettings}
          translations={tp}
        />
        <ChangePasswordForm 
          currentUser={currentUser}
          translations={tp}
        />
      </div>
    </>
  );
}
