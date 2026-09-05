'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { getLocale, setLocale as setI18nLocale, isAbroad as getIsAbroad, getCountry as getCountryHelper, t as translateHelper, type Locale } from '@/lib/i18n';

export interface I18nContextValue {
  locale: Locale;
  isAbroad: boolean;
  country: string;
  isMounted: boolean;
  changeLocale: (newLocale: Locale) => void;
  t: (key: string) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale = 'tr',
  initialIsAbroad = false,
  initialCountry = 'TR',
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialIsAbroad?: boolean;
  initialCountry?: string;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [isAbroadState, setIsAbroadState] = useState<boolean>(initialIsAbroad);
  const [countryState, setCountryState] = useState<string>(initialCountry);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);

    // Sync client-side preferences (runs after hydration, preventing SSR mismatches)
    try {
      const storedAbroadStr = localStorage.getItem('dailym-is-abroad');
      const storedLang = localStorage.getItem('dailym-lang') as Locale | null;
      const storedCountry = localStorage.getItem('dailym-country');

      let currentAbroad = isAbroadState;
      if (storedAbroadStr !== null) {
        currentAbroad = storedAbroadStr === '1';
        if (currentAbroad !== isAbroadState) {
          setIsAbroadState(currentAbroad);
          document.cookie = `IS_ABROAD=${currentAbroad ? '1' : '0'}; path=/; max-age=31536000`;
        }
      }

      let currentLang = locale;
      if (storedLang === 'tr' || storedLang === 'en') {
        currentLang = storedLang;
      } else if (currentAbroad && currentLang !== 'en') {
        currentLang = 'en';
      }

      if (currentLang !== locale) {
        setLocaleState(currentLang);
        setI18nLocale(currentLang);
        document.cookie = `NEXT_LOCALE=${currentLang}; path=/; max-age=31536000`;
      }

      if (storedCountry && storedCountry !== countryState) {
        setCountryState(storedCountry);
        document.cookie = `USER_COUNTRY=${storedCountry}; path=/; max-age=31536000`;
      }
    } catch {}

    const handleLocaleChange = () => {
      const loc = getLocale();
      const ab = getIsAbroad();
      const c = getCountryHelper();
      setLocaleState(loc);
      setIsAbroadState(ab);
      setCountryState(c);
    };

    window.addEventListener('dailym-locale-change', handleLocaleChange);
    window.addEventListener('storage', handleLocaleChange);

    return () => {
      window.removeEventListener('dailym-locale-change', handleLocaleChange);
      window.removeEventListener('storage', handleLocaleChange);
    };
  }, []);

  const changeLocale = useCallback((newLocale: Locale) => {
    setI18nLocale(newLocale);
    setLocaleState(newLocale);
  }, []);

  const t = useCallback((key: string) => {
    return translateHelper(key, locale);
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    isAbroad: isAbroadState,
    country: countryState,
    isMounted,
    changeLocale,
    t,
  }), [locale, isAbroadState, countryState, isMounted, changeLocale, t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    const loc = getLocale();
    const ab = getIsAbroad();
    return {
      locale: loc,
      isAbroad: ab,
      country: getCountryHelper(),
      isMounted: true,
      changeLocale: setI18nLocale,
      t: (key: string) => translateHelper(key, loc),
    };
  }
  return context;
}
