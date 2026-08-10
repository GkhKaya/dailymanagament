import { connectDB } from '@/lib/db';
import { sendDuePrayerNotifications } from '@/lib/push';
import { PrayerLocation } from '@/models/PrayerLocation';
import { syncPrayerMonthForUser } from '@/actions/prayer';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const now = new Date();
  let synced = 0;
  if (now.getDate() <= 2) {
    const locations = await PrayerLocation.find({}, { user_id: 1 }).lean();
    for (const location of locations) { try { synced += await syncPrayerMonthForUser(location.user_id, now.getFullYear(), now.getMonth() + 1); } catch (error) { console.error('Prayer month sync failed', location.user_id, error); } }
  }
  const sent = await sendDuePrayerNotifications(now); return Response.json({ success: true, synced, sent });
}
