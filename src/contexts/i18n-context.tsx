
"use client";
import type React from 'react';
import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';

// Define translations structure
interface Translations {
  [key: string]: string | Translations;
}

interface LocaleData {
  [lang: string]: Translations;
}

// Import locale files
import de from '@/locales/de.json';
import ar from '@/locales/ar.json';
import en from '@/locales/en.json';

const locales: LocaleData = { de, ar, en };

export type Language = 'de' | 'ar' | 'en';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode; defaultLanguage?: Language }> = ({
  children,
  defaultLanguage = 'de',
}) => {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('maw-id-lang', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  }, []);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('maw-id-lang') as Language | null;
      const initialLang = storedLang || defaultLanguage;
      setLanguageState(initialLang);
      document.documentElement.lang = initialLang;
      document.documentElement.dir = initialLang === 'ar' ? 'rtl' : 'ltr';
    }
  }, [defaultLanguage]);


  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let currentLangSet = locales[language] || locales.en; // Fallback to English if current language set is missing
    let current: string | Translations | undefined = currentLangSet;

    for (const k of keys) {
      if (typeof current === 'object' && current !== null && k in current) {
        current = current[k];
      } else {
        // Fallback to English for the specific key if not found
        current = locales.en;
        for (const k_fb of keys) {
            if (typeof current === 'object' && current !== null && k_fb in current) {
                current = current[k_fb];
            } else {
                return key; // Return key itself if not found even in English
            }
        }
        break;
      }
    }
    
    let result = typeof current === 'string' ? current : key;

    if (replacements) {
      Object.keys(replacements).forEach(rKey => {
        result = result.replace(new RegExp(`{{${rKey}}}`, 'g'), String(replacements[rKey]));
      });
    }

    return result;
  }, [language]);

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const value = useMemo(() => ({ language, setLanguage, t, dir }), [language, setLanguage, t, dir]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
