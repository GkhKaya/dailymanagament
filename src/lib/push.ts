import { PushSubscription } from '@/models/PushSubscription';
import { PrayerNotification } from '@/models/PrayerNotification';
import { PRAYER_AUTHORIZED_EMAIL } from '@/lib/prayer-times';

export function getVapidPublicKey() { return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''; }

export async function sendDuePrayerNotifications(now = new Date()) {
  const webpush = await import('web-push');
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; const privateKey = process.env.VAPID_PRIVATE_KEY; const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) throw new Error('VAPID ayarları eksik.');
  webpush.setVapidDetails(subject, publicKey, privateKey);
  const { User } = await import('@/models/User');
  const authorizedUser = await User.findOne({ email: PRAYER_AUTHORIZED_EMAIL }).select('_id').lean();
  if (!authorizedUser) return 0;
  const due = await PrayerNotification.find({ user_id: String(authorizedUser._id), status: 'pending', scheduled_at: { $lte: now } }).limit(100);
  let sent = 0;
  for (const notice of due) {
    const subscriptions = await PushSubscription.find({ user_id: notice.user_id, active: true });
    if (subscriptions.length === 0) continue;
    const claimed = await PrayerNotification.findOneAndUpdate({ _id: notice._id, status: 'pending' }, { $set: { status: 'sent', sent_at: now } }, { new: true });
    if (!claimed) continue;
    for (const subscription of subscriptions) {
      try { await webpush.sendNotification({ endpoint: subscription.endpoint, keys: subscription.keys }, JSON.stringify({ title: 'Namaz hatırlatması', body: notice.kind === 'after_15m' ? 'Namaz vaktinin üzerinden 15 dakika geçti.' : 'Namaz vaktinin üzerinden 1 saat geçti.', url: '/profile#namaz' })); sent++; }
      catch (error: unknown) { const details = error as { statusCode?: number; message?: string }; if ([404, 410].includes(details.statusCode || 0)) await PushSubscription.updateOne({ _id: subscription._id }, { $set: { active: false, last_error: 'expired' } }); else await PushSubscription.updateOne({ _id: subscription._id }, { $set: { last_error: String(details.message || error) } }); }
    }
  }
  return sent;
}
