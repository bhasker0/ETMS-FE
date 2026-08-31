'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from './types';
import { en } from './translations/en';
import { gu } from './translations/gu';
import { hi } from './translations/hi';
import { mr } from './translations/mr';
import { ta } from './translations/ta';
import { te } from './translations/te';
import { kn } from './translations/kn';
import { bn } from './translations/bn';

export type Translations = typeof en;

export const SUPPORTED_LANGUAGES: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
];

const dictionaries: Record<Language, Translations> = {
  en,
  gu: gu as unknown as Translations,
  hi: hi as unknown as Translations,
  mr: mr as unknown as Translations,
  ta: ta as unknown as Translations,
  te: te as unknown as Translations,
  kn: kn as unknown as Translations,
  bn: bn as unknown as Translations,
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  translate: (key: keyof Translations, fallback?: string) => string;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const I18nContext = createContext<I18nContextType>({
  language: 'en',
  setLanguage: () => {},
  t: en,
  translate: (key: keyof Translations, fallback?: string) => (en[key] as string) || fallback || '',
  supportedLanguages: SUPPORTED_LANGUAGES,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('etms_lang') as Language;
      if (saved && dictionaries[saved]) {
        setLanguageState(saved);
      }
    } catch (e) {
      console.warn('Could not read etms_lang from localStorage:', e);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    if (!dictionaries[lang]) return;
    setLanguageState(lang);
    try {
      localStorage.setItem('etms_lang', lang);
      document.documentElement.lang = lang;
    } catch (e) {
      console.warn('Could not save etms_lang to localStorage:', e);
    }
  };

  const currentDict = dictionaries[language] || en;

  const translate = (key: keyof Translations, fallback?: string): string => {
    return (currentDict[key] as string) || (en[key] as string) || fallback || String(key);
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t: currentDict,
        translate,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
