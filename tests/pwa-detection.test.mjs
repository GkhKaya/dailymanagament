import test from 'node:test';
import assert from 'node:assert/strict';

test('PWA & Device Platform Detection', async () => {
  // Test PWA detection in Node environment
  const { isPwaStandalone, getDeviceInfo, isPwaPromptDismissed, dismissPwaPrompt, resetPwaPromptDismissal } = await import('../src/lib/pwa-helpers.ts');

  // 1. SSR / Node.js safe fallback
  assert.equal(isPwaStandalone(), false, 'SSR default should be false');
  const defaultInfo = getDeviceInfo();
  assert.equal(defaultInfo.platform, 'other');
  assert.equal(defaultInfo.isStandalone, false);

  // 2. Mock browser window & userAgent for iOS
  global.window = {
    navigator: {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
      maxTouchPoints: 5,
    },
    innerWidth: 390,
    matchMedia: (query) => ({
      matches: false,
    }),
    location: {
      search: '',
    },
  };
  global.document = {
    referrer: '',
  };

  const iosInfo = getDeviceInfo();
  assert.equal(iosInfo.isIos, true, 'Should detect iOS user agent');
  assert.equal(iosInfo.isMobile, true, 'iOS should be flagged as mobile');
  assert.equal(iosInfo.platform, 'ios', 'Platform should be ios');
  assert.equal(isPwaStandalone(), false, 'Regular browser should not be standalone');

  // 3. Mock iOS Standalone (user added to home screen and opened from home screen)
  (global.window.navigator).standalone = true;
  assert.equal(isPwaStandalone(), true, 'iOS standalone flag should detect PWA');
  delete (global.window.navigator).standalone;

  // 4. Mock Android Chrome
  global.window.navigator.userAgent = 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
  global.window.navigator.platform = 'Linux armv8l';
  
  const androidInfo = getDeviceInfo();
  assert.equal(androidInfo.isAndroid, true, 'Should detect Android user agent');
  assert.equal(androidInfo.isMobile, true, 'Android should be flagged as mobile');
  assert.equal(androidInfo.platform, 'android', 'Platform should be android');

  // 5. Mock Android Standalone display-mode
  global.window.matchMedia = (query) => ({
    matches: query.includes('display-mode: standalone'),
  });
  assert.equal(isPwaStandalone(), true, 'Android display-mode: standalone should detect PWA');

  // 6. Mock Desktop Chrome
  global.window.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  global.window.navigator.platform = 'MacIntel';
  global.window.navigator.maxTouchPoints = 0;
  global.window.innerWidth = 1440;
  global.window.matchMedia = () => ({ matches: false });

  const desktopInfo = getDeviceInfo();
  assert.equal(desktopInfo.isMobile, false, 'Desktop should not be mobile');
  assert.equal(desktopInfo.platform, 'desktop', 'Platform should be desktop');

  // 7. Test dismissal storage logic
  let store = {};
  global.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = v.toString(); },
    removeItem: (k) => { delete store[k]; },
  };

  assert.equal(isPwaPromptDismissed(), false, 'Initially prompt is not dismissed');
  dismissPwaPrompt(1);
  assert.equal(isPwaPromptDismissed(), true, 'After 1-day dismissal, prompt should be dismissed');
  resetPwaPromptDismissal();
  assert.equal(isPwaPromptDismissed(), false, 'After reset, prompt should be active again');

  // Test: Long dismissal (e.g. from previously installed PWA) is auto-cleared when visited in browser
  store['dailym-pwa-dismissed-until'] = (Date.now() + 30 * 24 * 60 * 60 * 1000).toString();
  assert.equal(isPwaPromptDismissed(), false, 'Long dismissal should auto-reset when visiting in browser mode');
});
