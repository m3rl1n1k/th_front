
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Locale } from 'date-fns';
import { enUS, uk as ukLocale } from 'date-fns/locale'; // Import date-fns locales

import en from '@/locales/en.json';
// import es from '@/locales/es.json'; // Removed missing import
import uk from '@/locales/uk.json';

type Translations = typeof en;

interface I18nContextType {
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  t: (key: keyof Translations | string, options?: { defaultValue?: string } & Record<string, string | number>) => string;
  translations: Translations;
  dateFnsLocale: Locale; // Add date-fns locale to context
}

const translationsMap: Record<string, Translations> = {
  en,
  // es, // Removed from map
  uk,
};

const dateFnsLocaleMap: Record<string, Locale> = {
  en: enUS,
  uk: ukLocale,
  // Add es locale from date-fns if Spanish date formatting is needed
  // es: esLocale, // Removed from map
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

      const translationsToUse = isClient ? currentTranslations : en;

      let translation = translationsToUse[lookupKey];

      if (translation === undefined) { // Not found in current language
        translation = en[lookupKey]; // Try English
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
