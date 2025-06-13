
import { PageHeader } from '@/components/shared/PageHeader';
import { getUserSettings, updateUserSettings } from '@/lib/actions';
import type { UserSettings } from '@/lib/definitions';
import { SettingsForm } from './_components/SettingsForm';
import { getTranslations } from '@/lib/getTranslations';
import { redirect } from 'next/navigation';

export default async function SettingsPage({ /* params: { locale } */ }: { /* params: { locale: string } */ }) {
  const locale = 'en'; // Hardcode locale
  const t = await getTranslations(locale);
  const ts = t.settingsPage; 

  const currentSettings = await getUserSettings();

  if (!currentSettings) {
    console.error("User settings not found.");
    redirect('/dashboard'); // Redirect to non-prefixed dashboard
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
