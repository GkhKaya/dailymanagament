'use client';

import { useEffect, useState } from 'react';
import { Bell, MapPin, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPrayerDataAction, savePrayerLocationAction, savePushSubscriptionAction } from '@/actions/prayer';

const provinces = ['Adana','Adıyaman','Afyonkarahisar','Ankara','Antalya','Aydın','Balıkesir','Bursa','Çanakkale','Diyarbakır','Erzurum','Eskişehir','Gaziantep','Hatay','İstanbul','İzmir','Kahramanmaraş','Kayseri','Kocaeli','Konya','Malatya','Manisa','Mardin','Mersin','Muğla','Ordu','Sakarya','Samsun','Şanlıurfa','Tekirdağ','Trabzon','Van'];
const prayers = [['imsak','Sabah'],['ogle','Öğle'],['ikindi','İkindi'],['aksam','Akşam'],['yatsi','Yatsı']];
type PrayerDay = { date: string; times: Record<string, string> };

export function PrayerView() {
  const [province, setProvince] = useState(''); const [district, setDistrict] = useState(''); const [times, setTimes] = useState<PrayerDay[]>([]); const [busy, setBusy] = useState(false); const [pushReady, setPushReady] = useState(false);
  const load = async () => { const result = await getPrayerDataAction(); if (result.success) { setProvince(result.location?.province || ''); setDistrict(result.location?.district || ''); setTimes(result.times || []); } };
  // The effect intentionally hydrates client state from the authenticated server action.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);
  const save = async () => { setBusy(true); const result = await savePrayerLocationAction({ province, district }); setBusy(false); if (!result.success) return toast.error(result.error || 'Namaz konumu kaydedilemedi.'); toast.success('Namaz konumu kaydedildi.'); await load(); };
  const enablePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return toast.error('Bildirim için uygulamayı iPhone Ana Ekranına ekleyin.');
    try {
      const permission = await Notification.requestPermission(); if (permission !== 'granted') return toast.error('Bildirim izni verilmedi.');
      const registration = await navigator.serviceWorker.register('/sw.js');
      const key = await fetch('/api/push/vapid-public-key').then(r => r.text());
      if (!key) return toast.error('Bildirim ayarı eksik.');
      const applicationServerKey = Uint8Array.from(atob(key.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) throw new Error('Bildirim aboneliği oluşturulamadı.');
      const result = await savePushSubscriptionAction({ endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } }); if (!result.success) throw new Error(result.error || 'Bildirim kaydedilemedi.'); setPushReady(true); toast.success('Namaz bildirimleri açıldı.');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Bildirim açılamadı.'); }
  };
  const today = new Date().toISOString().slice(0, 10); const current = times.find(t => t.date === today) || times[0];
  return <div className="bg-[var(--surface-container-low)] border border-[var(--outline)] rounded-xl p-6 shadow-xl">
    <div className="flex items-center justify-between gap-3 mb-5"><div><h3 className="text-lg font-bold text-white flex items-center gap-2"><MapPin size={19} className="text-[var(--primary)]" /> Namaz Vakitleri</h3><p className="text-xs text-[var(--on-surface-variant)] mt-1">İl ve ilçeni seç. Aylık vakitler kaydedilsin.</p></div><button onClick={enablePush} className="px-3 py-2 rounded-lg border border-[var(--primary)] text-[var(--primary)] text-xs font-bold flex items-center gap-1.5"><Bell size={14} /> {pushReady ? 'Açık' : 'Bildirimleri aç'}</button></div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><select value={province} onChange={e => setProvince(e.target.value)} className="bg-[var(--surface-container)] border border-[var(--outline)] rounded-lg p-3 text-sm text-white"><option value="">İl seç</option>{provinces.map(p => <option key={p}>{p}</option>)}</select><input list="districts" value={district} onChange={e => setDistrict(e.target.value)} placeholder="İlçe yaz" className="bg-[var(--surface-container)] border border-[var(--outline)] rounded-lg p-3 text-sm text-white" /><datalist id="districts"><option value="Merkez" /><option value="Çankaya" /><option value="Kadıköy" /><option value="Üsküdar" /></datalist><button onClick={save} disabled={busy || !province || !district} className="rounded-lg bg-[var(--primary)] text-black font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"><Save size={15} /> {busy ? 'Kaydediliyor' : 'Kaydet'}</button></div>
    {current ? <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-2">{prayers.map(([key, label]) => <div key={key} className="bg-[var(--surface-container)] rounded-lg p-3"><div className="text-xs text-[var(--on-surface-variant)]">{label}</div><div className="text-lg font-bold text-white mt-1">{new Date(current.times[key]).toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})}</div><div className="text-[10px] text-[var(--on-surface-variant)] mt-1">+15 dk / +1 saat</div></div>)}</div> : <div className="mt-5 text-sm text-[var(--on-surface-variant)]">Önce il ve ilçe seç.</div>}
  </div>;
}
