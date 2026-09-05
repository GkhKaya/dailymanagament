import tr from '../locales/tr.json' with { type: 'json' };
import en from '../locales/en.json' with { type: 'json' };

export type Locale = 'tr' | 'en';

const dictionaries: Record<Locale, any> = {
  tr,
  en,
};

let inMemoryLocale: Locale = 'tr';
let inMemoryIsAbroad: boolean = false;
let inMemoryCountry: string = 'TR';

export function setServerLocale(locale: Locale, isAbroadVal: boolean = false, countryVal: string = 'TR') {
  inMemoryLocale = locale;
  inMemoryIsAbroad = isAbroadVal;
  inMemoryCountry = countryVal;
}

export function getInitialLocale(): Locale {
  if (typeof window !== 'undefined') {
    // 1. LocalStorage
    const stored = localStorage.getItem('dailym-lang') as Locale;
    if (stored === 'tr' || stored === 'en') {
      inMemoryLocale = stored;
      return stored;
    }

    // 2. Cookie
    const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
    if (match && (match[1] === 'tr' || match[1] === 'en')) {
      inMemoryLocale = match[1] as Locale;
      return inMemoryLocale;
    }

    // 3. Abroad flag
    if (localStorage.getItem('dailym-is-abroad') === '1') {
      inMemoryLocale = 'en';
      return 'en';
    }
  }
  return inMemoryLocale;
}

export function getLocale(): Locale {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('dailym-lang') as Locale;
    if (stored === 'tr' || stored === 'en') {
      inMemoryLocale = stored;
      return stored;
    }
    if (localStorage.getItem('dailym-is-abroad') === '1') {
      inMemoryLocale = 'en';
      return 'en';
    }
    const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
    if (match && (match[1] === 'tr' || match[1] === 'en')) {
      inMemoryLocale = match[1] as Locale;
      return inMemoryLocale;
    }
  }
  return inMemoryLocale;
}

export function isAbroad(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('dailym-is-abroad');
    if (stored !== null) {
      inMemoryIsAbroad = stored === '1';
      return inMemoryIsAbroad;
    }
    const match = document.cookie.match(/(?:^|;\s*)IS_ABROAD=([^;]*)/);
    if (match) {
      inMemoryIsAbroad = match[1] === '1';
      return inMemoryIsAbroad;
    }
  }
  return inMemoryIsAbroad;
}

export function getCountry(): string {
  return inMemoryCountry;
}

export function setLocale(locale: Locale) {
  inMemoryLocale = locale;
  if (typeof window !== 'undefined') {
    localStorage.setItem('dailym-lang', locale);
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
    
    // Google Translate sync - only if user explicitly activated Google Translate widget
    const isGoogleTranslateRequested = localStorage.getItem('dailym-google-translate-active') === '1' && !isAbroad();
    if (isGoogleTranslateRequested) {
      const isEn = locale === 'en';
      const transVal = isEn ? '/tr/en' : '/tr/tr';
      document.cookie = `googtrans=${transVal}; path=/; max-age=31536000`;
      try {
        document.cookie = `googtrans=${transVal}; path=/; domain=${window.location.hostname}; max-age=31536000`;
      } catch {}

      const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
      if (combo && combo.value !== (isEn ? 'en' : 'tr')) {
        combo.value = isEn ? 'en' : 'tr';
        combo.dispatchEvent(new Event('change'));
      }
    } else {
      // Clear googtrans cookie so native localization works cleanly without Google Translate tampering
      document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      try {
        document.cookie = `googtrans=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      } catch {}
    }

    window.dispatchEvent(new CustomEvent('dailym-locale-change', { detail: locale }));
  }
}

export function setResidencePreferences(prefs: { country: string; isAbroad: boolean; language: Locale }) {
  inMemoryCountry = prefs.country;
  inMemoryIsAbroad = prefs.isAbroad;
  inMemoryLocale = prefs.language;
  if (typeof window !== 'undefined') {
    localStorage.setItem('dailym-country', prefs.country);
    localStorage.setItem('dailym-is-abroad', prefs.isAbroad ? '1' : '0');
    localStorage.setItem('dailym-lang', prefs.language);
    document.cookie = `NEXT_LOCALE=${prefs.language}; path=/; max-age=31536000`;
    document.cookie = `USER_COUNTRY=${prefs.country}; path=/; max-age=31536000`;
    document.cookie = `IS_ABROAD=${prefs.isAbroad ? '1' : '0'}; path=/; max-age=31536000`;
    setLocale(prefs.language);
  }
}

export function getCurrencySymbol(overrideLocale?: string, overrideIsAbroad?: boolean): string {
  const abroad = overrideIsAbroad !== undefined ? overrideIsAbroad : (typeof window !== 'undefined' ? isAbroad() : false);
  if (!abroad) return '₺';
  const c = getCountry();
  if (['DE', 'FR', 'NL', 'IT', 'ES', 'AT', 'BE', 'IE'].includes(c)) return '€';
  if (['GB'].includes(c)) return '£';
  return '$';
}

export function formatCurrency(amount: number, overrideLocale?: string, overrideIsAbroad?: boolean): string {
  const abroad = overrideIsAbroad !== undefined ? overrideIsAbroad : inMemoryIsAbroad;
  if (abroad) {
    const c = getCountry();
    if (['DE', 'FR', 'NL', 'IT', 'ES', 'AT', 'BE', 'IE'].includes(c)) {
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    }
    if (['GB'].includes(c)) {
      return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
}

export function getStockCurrencySymbol(): string {
  return '₺';
}

export function formatStockCurrency(value: number): string {
  return `${value.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₺`;
}

/**
 * Basic translation helper.
 * Example usage: t('auth.login')
 */
export function t(key: string, overrideLocale?: Locale): string {
  const current = overrideLocale || inMemoryLocale;
  const dictionary = dictionaries[current] || dictionaries['tr'];

  const keys = key.split('.');
  let value: any = dictionary;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Fallback to Turkish if missing in English
      let fallback: any = dictionaries['tr'];
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = fallback[fk];
        } else {
          fallback = null;
          break;
        }
      }
      if (typeof fallback === 'string') return fallback;
      return key;
    }
  }

  return typeof value === 'string' ? value : key;
}
