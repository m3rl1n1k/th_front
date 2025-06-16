
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Locale } from 'date-fns';
import { enUS, uk as ukLocale } from 'date-fns/locale'; // Import date-fns locales

import en from '@/locales/en.json';
import es from '@/locales/es.json';
import uk from '@/locales/uk.json';

type Translations = typeof en;

interface I18nContextType {
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  t: (key: keyof Translations, replacements?: Record<string, string | number>) => string;
  translations: Translations;
  dateFnsLocale: Locale; // Add date-fns locale to context
}

const translationsMap: Record<string, Translations> = {
  en,
  es,
  uk,
};

const dateFnsLocaleMap: Record<string, Locale> = {
  en: enUS,
  uk: ukLocale,
  // Add es locale from date-fns if Spanish date formatting is needed
  // es: esLocale, 
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'financeflow_language';

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<string>('en');
  const [currentTranslations, setCurrentTranslations] = useState<Translations>(translationsMap.en);
  const [currentDateFnsLocale, setCurrentDateFnsLocale] = useState<Locale>(dateFnsLocaleMap.en);

  useEffect(() => {
    const storedLang = typeof window !== 'undefined' ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : 'en';
    const initialLang = translationsMap[storedLang] ? storedLang : 'en';
    setLanguageState(initialLang);
    setCurrentTranslations(translationsMap[initialLang]);
    setCurrentDateFnsLocale(dateFnsLocaleMap[initialLang] || enUS);
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
      console.warn(`Language "${lang}" not supported. Defaulting to 'en'.`);
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

  const t = useCallback((key: keyof Translations, replacements?: Record<string, string | number>): string => {
    let translation = currentTranslations[key] || en[key] || String(key);
    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        translation = translation.replace(new RegExp(`{${placeholder}}`, 'g'), String(value));
      });
    }
    return translation;
  }, [currentTranslations]);

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
