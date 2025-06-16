
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
// Removed useRouter as it's not used in setLanguage anymore
import en from '@/locales/en.json';
import es from '@/locales/es.json'; 
import uk from '@/locales/uk.json'; // Import Ukrainian translations

type Translations = typeof en; 

interface I18nContextType {
  language: string;
  setLanguage: (lang: string) => Promise<void>; 
  t: (key: keyof Translations, replacements?: Record<string, string | number>) => string;
  translations: Translations;
}

const translationsMap: Record<string, Translations> = {
  en,
  es, 
  uk, // Add Ukrainian translations to the map
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'financeflow_language';

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<string>('en');
  const [currentTranslations, setCurrentTranslations] = useState<Translations>(translationsMap.en);
  // Removed useRouter from here as it's not directly used by the provider for refresh

  useEffect(() => {
    const storedLang = typeof window !== 'undefined' ? localStorage.getItem(LANGUAGE_STORAGE_KEY) : 'en';
    const initialLang = translationsMap[storedLang] ? storedLang : 'en'; 
    setLanguageState(initialLang);
    setCurrentTranslations(translationsMap[initialLang]);
  }, []);

  const setLanguage = useCallback(async (lang: string): Promise<void> => {
    if (translationsMap[lang]) {
      await new Promise(resolve => setTimeout(resolve, 300)); 
      setLanguageState(lang);
      setCurrentTranslations(translationsMap[lang]);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      }
    } else {
      console.warn(`Language "${lang}" not supported. Defaulting to 'en'.`);
      if (lang !== 'en') {
        await new Promise(resolve => setTimeout(resolve, 300));
        setLanguageState('en');
        setCurrentTranslations(translationsMap.en);
        if (typeof window !== 'undefined') {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
        }
      }
    }
  }, []); // Removed router dependency

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

