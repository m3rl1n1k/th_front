
import 'server-only';

// Define a type for our translation files structure for better type safety
// This should ideally match the structure of your JSON files
interface Translations {
  dashboard: {
    title: string;
    description: string;
    totalBalance: string;
    monthlyIncome: string;
    monthlyExpenses: string;
    recentTransactions: string;
    recentActivity: string;
    spendingOverview: string;
  };
  sidebar: {
    dashboard: string;
    transactions: string;
    categories: string;
    wallets: string;
    transfers: string;
    logout: string;
  };
  [key: string]: any; // Allow other keys for future expansion
}


const translationsModules = {
  en: () => import('@/locales/en.json').then((module) => module.default),
  es: () => import('@/locales/es.json').then((module) => module.default),
  uk: () => import('@/locales/uk.json').then((module) => module.default),
};

export async function getTranslations(locale: string): Promise<Translations> {
  const lang = locale as keyof typeof translationsModules;
  if (translationsModules[lang]) {
    return translationsModules[lang]() as Promise<Translations>;
  }
  // Fallback to default locale if requested locale is not found
  console.warn(`Translations for locale "${locale}" not found. Falling back to "en".`);
  return translationsModules['en']() as Promise<Translations>;
}
