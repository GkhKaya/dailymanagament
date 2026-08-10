'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { PrayerLocation } from '@/models/PrayerLocation';
import { PrayerTime } from '@/models/PrayerTime';
import { PrayerNotification } from '@/models/PrayerNotification';
import { getMonthlyPrayerTimes } from '@/lib/prayer-provider-diyanet';
import { buildPrayerNotifications } from '@/lib/prayer-times';

async function userId() { const session = await auth.api.getSession({ headers: await headers() }); return session?.user?.id || null; }

export async function getPrayerDataAction(year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
  const id = await userId(); if (!id) return { success: false, error: 'Oturum gerekli.' };
  await connectDB();
  const [location, times] = await Promise.all([PrayerLocation.findOne({ user_id: id }).lean(), PrayerTime.find({ user_id: id, date: { $regex: `^${year}-${String(month).padStart(2, '0')}` } }).sort({ date: 1 }).lean()]);
  return { success: true, location: location ? { province: location.province, district: location.district } : null, times: JSON.parse(JSON.stringify(times)) };
}

export async function savePrayerLocationAction(input: { province: string; district: string }) {
  const id = await userId(); if (!id) return { success: false, error: 'Oturum gerekli.' };
  if (!input.province?.trim() || !input.district?.trim()) return { success: false, error: 'İl ve ilçe seçin.' };
  await connectDB();
  await PrayerNotification.updateMany({ user_id: id, status: 'pending' }, { $set: { status: 'cancelled' } });
  await PrayerLocation.findOneAndUpdate({ user_id: id }, { user_id: id, country: 'Türkiye', province: input.province, district: input.district, provider_city: input.district, timezone: 'Europe/Istanbul' }, { upsert: true, new: true });
  const now = new Date(); await syncPrayerMonthForUser(id, now.getFullYear(), now.getMonth() + 1);
  revalidatePath('/profile'); return { success: true };
}

export async function syncPrayerMonthForUser(id: string, year: number, month: number) {
  const location = await PrayerLocation.findOne({ user_id: id }).lean(); if (!location) throw new Error('Namaz konumu seçilmedi.');
  const days = await getMonthlyPrayerTimes(location.district, year, month);
  for (const day of days) {
    const record = await PrayerTime.findOneAndUpdate({ user_id: id, date: day.date }, { user_id: id, location_key: `${location.province}/${location.district}`, date: day.date, timezone: location.timezone, times: day.times, source: 'aladhan-turkey' }, { upsert: true, new: true });
    const notices = buildPrayerNotifications(day.times);
    for (const notice of notices) await PrayerNotification.findOneAndUpdate({ prayer_time_id: String(record._id), kind: notice.kind }, { user_id: id, prayer_time_id: String(record._id), kind: notice.kind, scheduled_at: notice.scheduled_at, status: notice.scheduled_at > new Date() ? 'pending' : 'cancelled' }, { upsert: true });
  }
  return days.length;
}

export async function savePushSubscriptionAction(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const id = await userId(); if (!id) return { success: false, error: 'Oturum gerekli.' };
  if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) return { success: false, error: 'Geçersiz bildirim aboneliği.' };
  await connectDB(); const { PushSubscription } = await import('@/models/PushSubscription');
  await PushSubscription.findOneAndUpdate({ endpoint: subscription.endpoint }, { user_id: id, ...subscription, active: true, last_error: null }, { upsert: true });
  return { success: true };
}
