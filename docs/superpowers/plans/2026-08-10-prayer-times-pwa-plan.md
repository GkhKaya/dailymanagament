# Namaz Vakitleri ve iOS PWA Bildirimleri Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kullanıcının seçtiği il/ilçenin aylık Diyanet namaz vakitlerini gösterip, vakitlerden 15 dakika ve 1 saat sonra iOS PWA push bildirimi göndermek.

**Architecture:** İl/ilçe ve aylık vakitler MongoDB modellerinde tutulacak. Diyanet sağlayıcısı sunucu tarafında aylık veri çekecek; ayrı bir cron route zamanı gelen teslimatları Web Push ile gönderecek. Profil içindeki Namaz client ekranı server action'larla konum/vakit verisini yönetecek ve service worker push olayını gösterecek.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, MongoDB/Mongoose, Web Push API, service worker, mevcut auth/session ve server action kalıpları.

## Global Constraints

- iOS push yalnızca Ana Ekran'a eklenmiş PWA ve kullanıcı etkileşimiyle verilen bildirim izniyle çalışır.
- Beş vakit: imsak/sabah, öğle, ikindi, akşam, yatsı.
- İki bildirim: vakit +15 dakika ve vakit +1 saat.
- Aylık veri sunucuda saklanır; gönderim uygulama kapalıyken cron ile yapılır.
- Diyanet API anahtarı, Web Push VAPID anahtarları ve cron secret istemciye açılmaz.
- Mevcut kirli çalışma ağacındaki kullanıcı değişiklikleri korunur.

---

### Task 1: Veri modelleri ve namaz zamanı çekirdeği

**Files:**
- Create: `src/models/PrayerLocation.ts`
- Create: `src/models/PrayerTime.ts`
- Create: `src/models/PrayerNotification.ts`
- Create: `src/models/PushSubscription.ts`
- Modify: `src/models/User.ts`
- Create: `src/lib/prayer-times.ts`
- Test: `tests/prayer-times.test.mjs`

**Interfaces:**
- `getMonthKey(date: Date, timezone: string): string`
- `buildPrayerNotifications(prayerTime): Array<{ kind: 'after_15m'|'after_1h'; scheduled_at: Date }>`
- `PrayerTimeProvider.getMonthlyTimes(locationId: string, year: number, month: number)`

- [ ] Write tests for month keys and the ten notification timestamps.
- [ ] Run `node --experimental-strip-types --test tests/prayer-times.test.mjs` and verify failure.
- [ ] Implement models, provider interface, monthly normalization, and user location settings.
- [ ] Run the focused test and verify pass.
- [ ] Commit `feat: add prayer time data models and scheduling core`.

### Task 2: Server actions and Diyanet monthly synchronization

**Files:**
- Create: `src/actions/prayer.ts`
- Create: `src/lib/prayer-provider-diyanet.ts`
- Modify: `src/lib/db.ts`
- Test: `tests/prayer-actions.test.mjs`

**Interfaces:**
- `savePrayerLocationAction(input)`
- `getPrayerMonthAction(year, month)`
- `syncPrayerMonthForUser(userId, year, month)`
- `cancelPendingPrayerNotifications(userId)`

- [ ] Write tests for saving a valid location, rejecting an incomplete location, and replacing future notifications after a location change.
- [ ] Run the focused test and verify failure.
- [ ] Implement authenticated actions, Diyanet API adapter, monthly upsert, and idempotent notification creation.
- [ ] Run focused tests and verify pass.
- [ ] Commit `feat: sync monthly prayer times by location`.

### Task 3: Web Push backend and cron delivery

**Files:**
- Modify: `package.json`
- Create: `src/lib/push.ts`
- Create: `src/actions/push.ts`
- Create: `src/app/api/cron/prayer-notifications/route.ts`
- Create: `src/app/api/push/vapid-public-key/route.ts`
- Create: `src/app/api/push/subscribe/route.ts`
- Test: `tests/push-delivery.test.mjs`

- [ ] Add the `web-push` dependency and VAPID environment variable names.
- [ ] Write tests for due-message selection, idempotent claiming, and expired subscription deactivation.
- [ ] Run focused tests and verify failure.
- [ ] Implement subscription registration and a cron route guarded by `CRON_SECRET`.
- [ ] Send payloads with title, body, icon, and `/profile#namaz` target; mark each delivery only once.
- [ ] Run focused tests and verify pass.
- [ ] Commit `feat: deliver prayer notifications with web push`.

### Task 4: PWA manifest, service worker, and profile Namaz UI

**Files:**
- Create: `src/app/manifest.ts`
- Create: `public/sw.js`
- Create: `src/components/profile/PrayerView.tsx`
- Modify: `src/components/profile/ProfileView.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/locales/tr.json`

- [ ] Add standalone manifest metadata and register the service worker from the client UI.
- [ ] Add the Namaz profile section with province/district selectors, save action, notification permission flow, and daily/month calendar list.
- [ ] Show clear iOS PWA installation and permission guidance when push is unavailable.
- [ ] Add Turkish labels and error/success messages.
- [ ] Run lint and build; verify no TypeScript or Next.js 16 errors.
- [ ] Commit `feat: add prayer profile and ios pwa setup`.

### Task 5: Integration verification and deployment notes

**Files:**
- Create: `docs/superpowers/plans/2026-08-10-prayer-times-pwa-deployment.md`
- Modify: `README.md`
- Test: `tests/prayer-times.test.mjs`, `tests/prayer-actions.test.mjs`, `tests/push-delivery.test.mjs`

- [ ] Run `npm test`, `npm run lint`, and `npm run build`.
- [ ] Test cron authorization and a synthetic due notification locally.
- [ ] Document required environment variables, monthly sync schedule, cron configuration, and iOS installation steps.
- [ ] Run `git diff --check` and report any environment-only limitation, such as missing Diyanet credentials or real iPhone testing.
- [ ] Commit `docs: add prayer notification deployment notes`.
