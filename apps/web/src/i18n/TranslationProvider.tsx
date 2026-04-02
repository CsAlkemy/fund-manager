import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { TranslationContext, Locale } from './useTranslation';
import en from './locales/en.json';
import bn from './locales/bn.json';

const translations: Record<Locale, Record<string, string>> = { en, bn };

export function TranslationProvider({ children }: { children: ReactNode }) {
  // Always start with 'en' to match SSR, then sync from localStorage after mount
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('language');
    if (saved === 'bn') setLocaleState('bn');
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('language', l);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let value = translations[locale]?.[key] ?? translations.en[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
      });
    }
    return value;
  }, [locale]);

  const ctx = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return (
    <TranslationContext.Provider value={ctx}>
      {children}
    </TranslationContext.Provider>
  );
}
