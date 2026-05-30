'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { translations, Language, TranslationKeys, supportedLanguages } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (_lang: Language) => void;
  t: TranslationKeys;
}

const defaultLanguage: Language = 'fr';

const defaultContext: LanguageContextType = {
  language: defaultLanguage,
  setLanguage: () => {},
  t: translations[defaultLanguage],
};

const LanguageContext = createContext<LanguageContextType>(defaultContext);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    const stored = localStorage.getItem('drawrun-language') as Language | null;
    if (stored && (supportedLanguages as unknown as Language[]).includes(stored)) {
      setLanguageState(stored);
    } else {
      const browserLang = navigator.language.toLowerCase().split('-')[0] as Language;
      if ((supportedLanguages as unknown as Language[]).includes(browserLang)) {
        setLanguageState(browserLang);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('drawrun-language', language);
    // Update html lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    if ((supportedLanguages as unknown as Language[]).includes(lang)) {
      setLanguageState(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return context;
}
