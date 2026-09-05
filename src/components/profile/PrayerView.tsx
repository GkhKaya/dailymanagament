'use client';

import { useEffect, useState } from 'react';
import { Bell, MapPin, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPrayerDataAction, getPrayerDistrictsAction, savePrayerLocationAction, savePushSubscriptionAction } from '@/actions/prayer';
import { TURKEY_PROVINCES } from '@/lib/turkey-locations';
import { useTranslation } from '@/hooks/useTranslation';

const prayers = [
  { key: 'imsak', tr: 'Sabah', en: 'Fajr' },
  { key: 'ogle', tr: 'Öğle', en: 'Dhuhr' },
  { key: 'ikindi', tr: 'İkindi', en: 'Asr' },
  { key: 'aksam', tr: 'Akşam', en: 'Maghrib' },
  { key: 'yatsi', tr: 'Yatsı', en: 'Isha' },
];
type PrayerDay = { date: string; times: Record<string, string> };

export function PrayerView() {
  const { locale, isAbroad: userAbroad } = useTranslation();
  const isEn = userAbroad || locale === 'en';

  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [districts, setDistricts] = useState<string[]>([]);
  const [times, setTimes] = useState<PrayerDay[]>([]);
  const [busy, setBusy] = useState(false);
  const [pushReady, setPushReady] = useState(false);

  const load = async () => {
    const result = await getPrayerDataAction();
    if (result.success) {
      setProvince(result.location?.province || '');
      setDistrict(result.location?.district || '');
      setTimes(result.times || []);
    }
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    void navigator.serviceWorker?.register('/sw.js').then(registration =>
      registration.pushManager.getSubscription().then(subscription => setPushReady(!!subscription))
    ).catch(() => setPushReady(false));
  }, []);

  useEffect(() => {
    if (!province) {
      setDistricts([]);
      setDistrict('');
      return;
    }
    void getPrayerDistrictsAction(province).then(result => {
      if (result.success) setDistricts((result.districts || []).map(item => item.name));
    });
  }, [province]);

  const save = async () => {
    setBusy(true);
    try {
      const result = await savePrayerLocationAction({ province, district });
      if (!result.success) return toast.error(result.error || (isEn ? 'Failed to save prayer location.' : 'Namaz konumu kaydedilemedi.'));
      await load();
      toast.success(isEn ? 'Prayer location and times updated.' : 'Namaz konumu ve vakitler güncellendi.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (isEn ? 'Failed to update prayer times.' : 'Namaz vakitleri güncellenemedi.'));
    } finally { setBusy(false); }
  };

  const enablePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      return toast.error(isEn ? 'Add the app to your iPhone Home Screen to enable notifications.' : 'Bildirim için uygulamayı iPhone Ana Ekranına ekleyin.');
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return toast.error(isEn ? 'Notification permission not granted.' : 'Bildirim izni verilmedi.');
      const registration = await navigator.serviceWorker.register('/sw.js');
      const key = await fetch('/api/push/vapid-public-key').then(r => r.text());
      if (!key) return toast.error(isEn ? 'Push notification setup missing.' : 'Bildirim ayarı eksik.');
      const normalizedKey = key.trim().replace(/-/g, '+').replace(/_/g, '/');
      const paddedKey = normalizedKey + '='.repeat((4 - normalizedKey.length % 4) % 4);
      const applicationServerKey = Uint8Array.from(atob(paddedKey), c => c.charCodeAt(0));
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error(isEn ? 'Could not create subscription.' : 'Bildirim aboneliği oluşturulamadı.');
      const result = await savePushSubscriptionAction({ endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } });
      if (!result.success) throw new Error(result.error || (isEn ? 'Failed to save notification.' : 'Bildirim kaydedilemedi.'));
      setPushReady(true);
      toast.success(isEn ? 'Prayer notifications enabled.' : 'Namaz bildirimleri açıldı.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (isEn ? 'Could not enable notifications.' : 'Bildirim açılamadı.'));
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const current = times.find(t => t.date === today) || times[0];

  return (
    <div id="namaz" className="bg-[var(--surface-container-low)] border border-[var(--outline)] rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MapPin size={19} className="text-[var(--primary)]" /> {isEn ? 'Prayer Times' : 'Namaz Vakitleri'}
          </h3>
          <p className="text-xs text-[var(--on-surface-variant)] mt-1">
            {isEn ? 'Select your province and district in Turkey to track monthly times.' : 'İl ve ilçeni seç. Aylık vakitler kaydedilsin.'}
          </p>
        </div>
        <button
          onClick={enablePush}
          className="px-3 py-2 rounded-lg border border-[var(--primary)] text-[var(--primary)] text-xs font-bold flex items-center gap-1.5 hover:bg-[var(--primary)]/10 transition-colors"
        >
          <Bell size={14} /> {pushReady ? (isEn ? 'Enabled' : 'Açık') : (isEn ? 'Turn On Notifications' : 'Bildirimleri aç')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          value={province}
          onChange={e => { setProvince(e.target.value); setDistrict(''); }}
          className="bg-[var(--surface-container)] border border-[var(--outline)] rounded-lg p-3 text-sm text-white"
        >
          <option value="">{isEn ? 'Select province' : 'İl seç'}</option>
          {TURKEY_PROVINCES.map(p => <option key={p}>{p}</option>)}
        </select>
        <select
          value={district}
          onChange={e => setDistrict(e.target.value)}
          disabled={!province || districts.length === 0}
          className="bg-[var(--surface-container)] border border-[var(--outline)] rounded-lg p-3 text-sm text-white disabled:opacity-50"
        >
          <option value="">{districts.length ? (isEn ? 'Select district' : 'İlçe seç') : (isEn ? 'Select province first' : 'İl seçin')}</option>
          {districts.map(item => <option key={item}>{item}</option>)}
        </select>
        <button
          onClick={save}
          disabled={busy || !province || !district}
          className="rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:bg-[rgba(255,255,255,0.06)] disabled:text-[rgba(255,255,255,0.4)] disabled:border disabled:border-[rgba(255,255,255,0.08)] disabled:opacity-100 disabled:cursor-not-allowed shadow-md"
        >
          <Save size={15} /> {busy ? (isEn ? 'Saving...' : 'Kaydediliyor') : (isEn ? 'Save' : 'Kaydet')}
        </button>
      </div>

      {current ? (
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-2">
          {prayers.map(({ key, tr, en }) => (
            <div key={key} className="bg-[var(--surface-container)] rounded-lg p-3">
              <div className="text-xs text-[var(--on-surface-variant)]">{isEn ? en : tr}</div>
              <div className="text-lg font-bold text-white mt-1">
                {new Date(current.times[key]).toLocaleTimeString(isEn ? 'en-US' : 'tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-[10px] text-[var(--on-surface-variant)] mt-1">{isEn ? '+15 min / +1 hr' : '+15 dk / +1 saat'}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 text-sm text-[var(--on-surface-variant)]">
          {isEn ? 'Please select a province and district first.' : 'Önce il ve ilçe seç.'}
        </div>
      )}
    </div>
  );
}

