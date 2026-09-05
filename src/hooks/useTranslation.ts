'use client';

import { useI18n } from '@/components/providers/I18nProvider';

/**
 * Client React hook to subscribe to locale and residence changes dynamically.
 * Hydration safe via I18nProvider context.
 */
export function useTranslation() {
  return useI18n();
}

