
import { PageHeader } from '@/components/shared/PageHeader';
import { getUserSettings, updateUserSettings } from '@/lib/actions';
import type { UserSettings } from '@/lib/definitions';
import { SettingsForm } from './_components/SettingsForm';
import { getTranslations } from '@/lib/getTranslations';
import { redirect } from 'next/navigation';

export default async function SettingsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations(locale);
  const ts = t.settingsPage; // Translations for settings page

  const currentSettings = await getUserSettings();

  if (!currentSettings) {
    // Handle case where settings might not be initialized (should not happen with current mock data)
    // Or redirect to an error page or show a message
    console.error("User settings not found.");
    // For now, let's provide a default if somehow they are missing
    // This path should ideally not be reached if actions.ts initializes settings.
    redirect(`/${locale}/dashboard`); // Or show an error
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

