'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from './types';
import { gu } from './translations/gu';
import { hi } from './translations/hi';
import { en } from './translations/en';

type Translations = typeof gu;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const dictionaries: Record<Language, Translations> = {
  gu,
  hi,
  en,
};

const I18nContext = createContext<I18nContextType>({
  language: 'gu',
  setLanguage: () => {},
  t: gu,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('gu');

  useEffect(() => {
    const saved = localStorage.getItem('etms_lang') as Language;
    if (saved && (saved === 'gu' || saved === 'hi' || saved === 'en')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('etms_lang', lang);
    }
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t: dictionaries[language] || gu,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
