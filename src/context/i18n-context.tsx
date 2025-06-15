
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // For potential language query param updates
import en from '@/locales/en.json';
import es from '@/locales/es.json'; // Example, add more as needed
// REMOVED: import { useGlobalLoader } from './global-loader-context';

type Translations = typeof en; // Assuming 'en' is the base structure

interface I18nContextType {
  language: string;
  setLanguage: (lang: string) => Promise<void>; // Changed to Promise<void>
  t: (key: keyof Translations, replacements?: Record<string, string | number>) => string;
  translations: Translations;
}

const translationsMap: Record<string, Translations> = {
  en,
  es,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'financeflow_language';

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<string>('en');
  const [currentTranslations, setCurrentTranslations] = useState<Translations>(translationsMap.en);
  // REMOVED: const { setIsLoading: setGlobalLoading } = useGlobalLoader();
  const router = useRouter();

  useEffect(() => {
    const storedLang = typeof window !== 'undefined' ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : 'en';
    const initialLang = translationsMap[storedLang] ? storedLang : 'en';
    setLanguageState(initialLang);
    setCurrentTranslations(translationsMap[initialLang]);
  }, []);

  const setLanguage = useCallback(async (lang: string): Promise<void> => {
    if (translationsMap[lang]) {
      // REMOVED: setGlobalLoading(true);
      // Simulate loading delay for language change
      await new Promise(resolve => setTimeout(resolve, 300)); 
      setLanguageState(lang);
      setCurrentTranslations(translationsMap[lang]);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
        // Optionally update URL, e.g., router.push(`?lang=${lang}`, { scroll: false });
      }
      // REMOVED: setGlobalLoading(false);
    } else {
      console.warn(`Language "${lang}" not supported.`);
    }
  }, [router]); // Removed setGlobalLoading from dependencies

  const t = useCallback((key: keyof Translations, replacements?: Record<string, string | number>): string => {
    let translation = currentTranslations[key] || en[key] || String(key); // Fallback to key if not found
    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        translation = translation.replace(new RegExp(`{${placeholder}}`, 'g'), String(value));
      });
    }
    return translation;
  }, [currentTranslations]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, translations: currentTranslations }}>
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
