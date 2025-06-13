
import { PageHeader } from '@/components/shared/PageHeader';
import { getUserSettings, updateUserSettings } from '@/lib/actions';
import type { UserSettings } from '@/lib/definitions';
import { SettingsForm } from './_components/SettingsForm';
import { getTranslations } from '@/lib/getTranslations';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers'; // Import cookies

export default async function SettingsPage() {
  const cookieStore = cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const t = await getTranslations(locale);
  const ts = t.settingsPage; 

  const currentSettings = await getUserSettings();

  if (!currentSettings) {
    console.error("User settings not found.");
    redirect('/dashboard');
  }
  
  const handleUpdateSettings = async (data: Partial<UserSettings>) => {
    'use server';
    return updateUserSettings(data);
  };

  return (
    <>
      <PageHeader title={ts.title} description={ts.description} />
      <SettingsForm 
        initialSettings={currentSettings} 
        onSubmitAction={handleUpdateSettings}
        translations={ts}
      />
    </>
  );
}
