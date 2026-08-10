# Namaz Bildirimleri Kurulum Notları

## Ortam değişkenleri

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@example.com
CRON_SECRET=uzun-rastgele-deger
PRAYER_TIMES_API_URL=https://api.aladhan.com/v1/calendarByCity
PRAYER_TIMES_METHOD=13
```

VAPID anahtarları bir kez `npx web-push generate-vapid-keys` ile üretilebilir. Özel anahtar istemciye veya git deposuna konmaz.

## Cron

`GET /api/cron/prayer-notifications` adresi her dakika şu header ile çağrılmalı:

```text
Authorization: Bearer <CRON_SECRET>
```

Ayın ilk iki gününde aynı görev kayıtlı tüm kullanıcıların o ayki vakitlerini yeniler; her dakika zamanı gelen teslimatları yollar. Vercel Cron, GitHub Actions veya barındırma sağlayıcısının cron hizmeti kullanılabilir.

## iPhone kurulumu

Safari’de uygulamayı aç, Paylaş → Ana Ekrana Ekle. Ana Ekran’daki DailyM ikonunu aç, Profil → Namaz bölümüne gir, il/ilçe kaydet ve “Bildirimleri aç” düğmesine bas. iOS 16.4 veya üstü gerekir.

## Kaynak

Vakit kaynağı Diyanet İşleri Başkanlığı verilerini sunan İmsakiyem API’dir. İlçe kimliği sunucu tarafında çözülür ve aylık veriler bu kimlikle çekilir.
