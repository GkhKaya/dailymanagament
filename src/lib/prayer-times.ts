export type PrayerKind = 'imsak' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi';
export const PRAYER_LABELS: Record<PrayerKind, string> = { imsak: 'Sabah', ogle: 'Öğle', ikindi: 'İkindi', aksam: 'Akşam', yatsi: 'Yatsı' };

export function getMonthKey(date = new Date(), timezone = 'Europe/Istanbul') {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit' }).formatToParts(date);
  return `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}`;
}

export function parseLocalTime(date: string, time: string, timezone = 'Europe/Istanbul') {
  const [hour, minute] = time.split(':').map(Number);
  const base = new Date(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+03:00`);
  return timezone === 'Europe/Istanbul' ? base : new Date(base.toLocaleString('en-US', { timeZone: timezone }));
}

export function buildPrayerNotifications(times: Record<PrayerKind, Date>) {
  return Object.entries(times).flatMap(([prayer, at]) => [
    { prayer, kind: 'after_15m' as const, scheduled_at: new Date(at.getTime() + 15 * 60_000) },
    { prayer, kind: 'after_1h' as const, scheduled_at: new Date(at.getTime() + 60 * 60_000) },
  ]);
}

export function normalizeProviderTimes(date: string, timings: Record<string, string>, timezone = 'Europe/Istanbul') {
  const clean = (value: string) => value.split(' ')[0];
  return { imsak: parseLocalTime(date, clean(timings.Imsak), timezone), ogle: parseLocalTime(date, clean(timings.Dhuhr), timezone), ikindi: parseLocalTime(date, clean(timings.Asr), timezone), aksam: parseLocalTime(date, clean(timings.Maghrib), timezone), yatsi: parseLocalTime(date, clean(timings.Isha), timezone) };
}

export function normalizeDiyanetTimes(date: string, timings: Record<string, string>) {
  const time = (value: string) => parseLocalTime(date, value, 'Europe/Istanbul');
  return { imsak: time(timings.imsak), ogle: time(timings.ogle), ikindi: time(timings.ikindi), aksam: time(timings.aksam), yatsi: time(timings.yatsi) };
}
