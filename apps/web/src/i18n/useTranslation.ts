import { createContext, useContext } from 'react';

export type Locale = 'en' | 'bn';

export interface TranslationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const TranslationContext = createContext<TranslationContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
});

export function useTranslation() {
  return useContext(TranslationContext);
}
