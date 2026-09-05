/**
 * PWA & Device Platform Detection Utilities
 */

export type DevicePlatform = 'ios' | 'android' | 'desktop' | 'other';

export interface DeviceInfo {
  platform: DevicePlatform;
  isMobile: boolean;
  isIos: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isStandalone: boolean;
}

const PWA_DISMISS_KEY = 'dailym-pwa-dismissed-until';

/**
 * Checks whether the application is currently running in PWA standalone mode
 * (meaning the user has installed it and launched it from the home screen / app launcher).
 */
export function isPwaStandalone(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Standard CSS display-mode query
  const isDisplayStandalone = window.matchMedia?.('(display-mode: standalone)').matches;
  if (isDisplayStandalone) return true;

  // 2. iOS Safari standalone boolean
  if ((window.navigator as any).standalone === true) return true;

  // 3. Android Trusted Web Activity (TWA) referrer check
  if (typeof document !== 'undefined' && document.referrer?.startsWith('android-app://')) {
    return true;
  }

  // 4. Check query parameter if launched with ?mode=pwa
  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'pwa' || urlParams.get('source') === 'pwa') {
      return true;
    }
  } catch {}

  return false;
}

/**
 * Detects the user device, operating system, and browser engine
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      platform: 'other',
      isMobile: false,
      isIos: false,
      isAndroid: false,
      isSafari: false,
      isChrome: false,
      isStandalone: false,
    };
  }

  const ua = window.navigator.userAgent || '';
  const navPlatform = window.navigator.platform || '';
  const maxTouchPoints = window.navigator.maxTouchPoints || 0;

  // iOS detection (including iPadOS where userAgent looks like MacIntel but maxTouchPoints > 1)
  const isIos = /iPad|iPhone|iPod/.test(ua) || (navPlatform === 'MacIntel' && maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);

  // Mobile detection: user agent keywords or mobile screen width
  const isMobile = isIos || isAndroid || /Mobi|Mobile/i.test(ua) || (window.innerWidth <= 820);

  // Browser engine detection
  const isChrome = /CriOS|Chrome/i.test(ua) && !/Edge|EdgA/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/CriOS|Chrome|FxiOS|Edg/i.test(ua);

  let platform: DevicePlatform = 'other';
  if (isIos) platform = 'ios';
  else if (isAndroid) platform = 'android';
  else if (!isMobile) platform = 'desktop';

  const isStandalone = isPwaStandalone();

  return {
    platform,
    isMobile,
    isIos,
    isAndroid,
    isSafari,
    isChrome,
    isStandalone,
  };
}

/**
 * Checks if the user dismissed the install banner recently
 */
export function isPwaPromptDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    // 1. URL override for easy testing (?pwa=1 or ?install=1)
    if (window.location.search.includes('pwa=1') || window.location.search.includes('install=1')) {
      return false;
    }

    const dismissedUntil = localStorage.getItem(PWA_DISMISS_KEY);
    if (!dismissedUntil) return false;
    const expiry = parseInt(dismissedUntil, 10);
    if (isNaN(expiry)) return false;

    // 2. If expiry was set far in the future (e.g. from previously installed PWA)
    // but the user has uninstalled the PWA and is now visiting from a web browser,
    // clear the old dismissal so the banner appears again!
    if (expiry > Date.now() + 2 * 24 * 60 * 60 * 1000 && !isPwaStandalone()) {
      localStorage.removeItem(PWA_DISMISS_KEY);
      return false;
    }

    return Date.now() < expiry;
  } catch {
    return false;
  }
}

/**
 * Temporarily dismisses the install prompt for N days (default: 7 days)
 */
export function dismissPwaPrompt(days: number = 7): void {
  if (typeof window === 'undefined') return;
  try {
    const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(PWA_DISMISS_KEY, expiry.toString());
  } catch {}
}

/**
 * Clears the dismissal so the prompt can be tested or triggered again
 */
export function resetPwaPromptDismissal(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PWA_DISMISS_KEY);
  } catch {}
}
