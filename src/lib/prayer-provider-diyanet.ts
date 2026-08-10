import { normalizeProviderTimes, PrayerKind } from '@/lib/prayer-times';

export type MonthlyPrayerDay = { date: string; times: Record<PrayerKind, Date> };

/** Uses AlAdhan's Turkey/Diyanet-compatible method by default. Replace URL with the official provider when credentials are available. */
export async function getMonthlyPrayerTimes(city: string, year: number, month: number): Promise<MonthlyPrayerDay[]> {
  const base = process.env.PRAYER_TIMES_API_URL || 'https://api.aladhan.com/v1/calendarByCity';
  const url = new URL(`${base}/${year}/${month}`);
  url.searchParams.set('city', city); url.searchParams.set('country', 'Turkey'); url.searchParams.set('method', process.env.PRAYER_TIMES_METHOD || '13');
  const response = await fetch(url, { next: { revalidate: 86400 } });
  if (!response.ok) throw new Error(`Namaz vakitleri alınamadı (${response.status})`);
  const payload = await response.json() as { code: number; data: Array<{ date: { gregorian: { date: string } }; timings: Record<string, string> }> };
  if (payload.code !== 200 || !Array.isArray(payload.data)) throw new Error('Namaz vakitleri sağlayıcısı geçersiz yanıt verdi.');
  return payload.data.map(item => {
    const [day, monthPart, yearPart] = item.date.gregorian.date.split('-');
    const date = `${yearPart}-${monthPart}-${day}`;
    return { date, times: normalizeProviderTimes(date, item.timings) };
  });
}
