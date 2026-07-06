import tr from '../locales/tr.json';

// In the future, this can be extended to support multiple languages dynamically.
const dictionaries: Record<string, any> = {
  tr,
};

// Default to TR for now
const currentLocale = 'tr';

/**
 * Basic translation helper.
 * Example usage: t('auth.login')
 */
export function t(key: string): string {
  const dictionary = dictionaries[currentLocale] || dictionaries['tr'];
  
  // Support nested keys (e.g. 'auth.login')
  const keys = key.split('.');
  let value = dictionary;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  
  return value as string;
}
