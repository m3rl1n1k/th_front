
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Locale } from 'date-fns';
import { enUS, uk as ukLocale } from 'date-fns/locale';

// Import all JSON files for English
import enAuth from '@/locales/en/auth.json';
import enBudgets from '@/locales/en/budgets.json';
import enCapital from '@/locales/en/capital.json';
import enCategories from '@/locales/en/categories.json';
import enCommon from '@/locales/en/common.json';
import enCurrencies from '@/locales/en/currencies.json';
import enDashboard from '@/locales/en/dashboard.json';
import enFeedback from '@/locales/en/feedback.json';
import enHomepage from '@/locales/en/homepage.json';
import enProfile from '@/locales/en/profile.json';
import enReports from '@/locales/en/reports.json';
import enSettings from '@/locales/en/settings.json';
import enTransactions from '@/locales/en/transactions.json';
import enTransfers from '@/locales/en/transfers.json';
import enWallets from '@/locales/en/wallets.json';

// Import all JSON files for Ukrainian
import ukAuth from '@/locales/uk/auth.json';
import ukBudgets from '@/locales/uk/budgets.json';
import ukCapital from '@/locales/uk/capital.json';
import ukCategories from '@/locales/uk/categories.json';
import ukCommon from '@/locales/uk/common.json';
import ukCurrencies from '@/locales/uk/currencies.json';
import ukDashboard from '@/locales/uk/dashboard.json';
import ukFeedback from '@/locales/uk/feedback.json';
import ukHomepage from '@/locales/uk/homepage.json';
import ukProfile from '@/locales/uk/profile.json';
import ukReports from '@/locales/uk/reports.json';
import ukSettings from '@/locales/uk/settings.json';
import ukTransactions from '@/locales/uk/transactions.json';
import ukTransfers from '@/locales/uk/transfers.json';
import ukWallets from '@/locales/uk/wallets.json';

// Merge all translations for each language
const enTranslations = {
  ...enAuth, ...enBudgets, ...enCapital, ...enCategories, ...enCommon,
  ...enCurrencies, ...enDashboard, ...enFeedback, ...enHomepage, ...enProfile,
  ...enReports, ...enSettings, ...enTransactions, ...enTransfers, ...enWallets
};

const ukTranslations = {
  ...ukAuth, ...ukBudgets, ...ukCapital, ...ukCategories, ...ukCommon,
  ...ukCurrencies, ...ukDashboard, ...ukFeedback, ...ukHomepage, ...ukProfile,
  ...ukReports, ...ukSettings, ...ukTransactions, ...ukTransfers, ...ukWallets
};


type Translations = typeof enTranslations;

interface I18nContextType {
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  t: (key: keyof Translations | string, options?: { defaultValue?: string } & Record<string, string | number>) => string;
  translations: Translations;
  dateFnsLocale: Locale; // Add date-fns locale to context
}

const translationsMap: Record<string, Translations> = {
  en: enTranslations,
  uk: ukTranslations,
};

const dateFnsLocaleMap: Record<string, Locale> = {
  en: enUS,
  uk: ukLocale,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'financeflow_language';

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<string>('en');
  const [currentTranslations, setCurrentTranslations] = useState<Translations>(translationsMap.en);
  const [currentDateFnsLocale, setCurrentDateFnsLocale] = useState<Locale>(dateFnsLocaleMap.en);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      const initialLang = (storedLang && translationsMap[storedLang]) ? storedLang : 'en';
      setLanguageState(initialLang);
      setCurrentTranslations(translationsMap[initialLang]);
      setCurrentDateFnsLocale(dateFnsLocaleMap[initialLang] || enUS);
    }
  }, []);

  const setLanguage = useCallback(async (lang: string): Promise<void> => {
    if (translationsMap[lang]) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setLanguageState(lang);
      setCurrentTranslations(translationsMap[lang]);
      setCurrentDateFnsLocale(dateFnsLocaleMap[lang] || enUS); // Update date-fns locale
      if (typeof window !== 'undefined') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      }
    } else {
      // Language not supported, default to 'en'
      if (lang !== 'en') {
        await new Promise(resolve => setTimeout(resolve, 300));
        setLanguageState('en');
        setCurrentTranslations(translationsMap.en);
        setCurrentDateFnsLocale(dateFnsLocaleMap.en); // Reset date-fns locale
        if (typeof window !== 'undefined') {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
        }
      }
    }
  }, []);

  const t = useCallback(
    (key: keyof Translations | string, options?: { defaultValue?: string } & Record<string, string | number>): string => {
      const { defaultValue, ...replacements } = options || {};
      const lookupKey = key as keyof Translations; // Assume key is valid for lookups

      const translationsToUse = isClient ? currentTranslations : enTranslations;

      let translation = translationsToUse[lookupKey];

      if (translation === undefined) { // Not found in current language
        translation = enTranslations[lookupKey]; // Try English
      }

      if (translation === undefined) { // Still not found
        translation = defaultValue !== undefined ? defaultValue : String(key); // Use defaultValue or key itself
      }
      
      if (replacements && Object.keys(replacements).length > 0) {
        Object.entries(replacements).forEach(([placeholder, value]) => {
          translation = translation.replace(new RegExp(`{${placeholder}}`, 'g'), String(value));
        });
      }
      return translation;
    },
    [currentTranslations, isClient]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, translations: currentTranslations, dateFnsLocale: currentDateFnsLocale }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
