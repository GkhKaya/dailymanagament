import { normalizeDiyanetTimes, PrayerKind } from '@/lib/prayer-times';

export type MonthlyPrayerDay = { date: string; times: Record<PrayerKind, Date> };
const API = process.env.PRAYER_TIMES_API_URL || 'https://ezanvakti.imsakiyem.com/api';

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { next: { revalidate: 86400 } });
  if (!response.ok) throw new Error(`Diyanet namaz vakitleri alınamadı (${response.status})`);
  const payload = await response.json() as { success: boolean; data: T };
  if (!payload.success) throw new Error('Diyanet namaz vakitleri geçersiz yanıt verdi.');
  return payload.data;
}

export async function resolveDiyanetDistrictId(province: string, district: string) {
  type State = { _id: string; name: string };
  type District = { _id: string; name: string };
  const states = await getJson<State[]>(`${API}/locations/states?countryId=2`);
  const normalize = (value: string) => value.trim().toLocaleUpperCase('tr-TR').replaceAll('İ', 'I');
  const state = states.find(item => normalize(item.name) === normalize(province));
  if (!state) throw new Error('İl Diyanet kaynağında bulunamadı.');
  const districts = await getJson<District[]>(`${API}/locations/districts?stateId=${state._id}`);
  const match = districts.find(item => normalize(item.name) === normalize(district));
  if (!match) throw new Error('İlçe Diyanet kaynağında bulunamadı.');
  return match._id;
}

export async function getMonthlyPrayerTimes(districtId: string, year: number, month: number): Promise<MonthlyPrayerDay[]> {
  const rows = await getJson<Array<{ date: string; times: Record<string, string> }>>(`${API}/prayer-times/${districtId}/monthly?startDate=${year}-${String(month).padStart(2, '0')}-01`);
  return rows.map(item => ({ date: item.date.slice(0, 10), times: normalizeDiyanetTimes(item.date.slice(0, 10), item.times) }));
}
