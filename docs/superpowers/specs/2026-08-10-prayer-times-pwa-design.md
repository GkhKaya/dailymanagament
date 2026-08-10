# Namaz Vakitleri ve iOS PWA Bildirimleri

## Amaç

Kullanıcının profilinden seçtiği il ve ilçeye göre Diyanet namaz vakitlerini göstermek; her vakitten 15 dakika ve 1 saat sonra, uygulama kapalı olsa bile iOS Ana Ekran PWA'sına push bildirimi göndermek.

## Kullanıcı deneyimi

Profil ekranına **Namaz** bölümü eklenecek. Kullanıcı Türkiye'deki il ve ilçesini seçip kaydedecek. Aynı ekranda bugünün imsak, öğle, ikindi, akşam ve yatsı vakitleri liste halinde görünecek. Tarih seçilerek ayın diğer günleri de görüntülenebilecek.

Kullanıcı, yalnızca il ve ilçe seçildikten sonra **Bildirimleri aç** düğmesine basabilecek. Bu düğme service worker kaydını yapacak ve tarayıcının bildirim iznini, kullanıcının doğrudan eylemiyle isteyecek. iPhone'da bunun çalışması için uygulamanın Safari üzerinden Ana Ekran'a eklenmiş olması gerekir. İzin veya Ana Ekran kurulumu yoksa ekranda açık ve yönlendirici bir durum mesajı gösterilecek.

## Vakit verisi

Bir `PrayerTimeProvider` arayüzü kullanılacak. İlk sağlayıcı, Diyanet'in resmi Awqat Salah REST API'si olacak. API erişim kaydı ve anahtarı sunucu ortam değişkenlerinde tutulacak; istemciye gönderilmeyecek. Sağlayıcı; il/ilçe listesini ve seçilen yerin aylık vakitlerini döndürecek.

Her ayın başında, ayrıca kullanıcı il/ilçe seçtiğinde, seçilen yer için ilgili ayın bütün vakitleri çekilip veritabanına kaydedilecek. Vakitler her günün yerel saat dilimiyle birlikte saklanacak. Aylık verinin tamamı kaydedildiği için uygulama ekranı dış kaynağa bağımlı olmadan çalışacak.

## Bildirim mimarisi

PWA manifesti, service worker ve standart Web Push altyapısı eklenecek. Her cihaz/kurulum için push aboneliği kullanıcıya bağlı ayrı bir kayıtta tutulacak.

Her namaz vakti için iki teslimat kaydı oluşturulacak:

- vakit + 15 dakika
- vakit + 1 saat

Sunucuda dakikada bir çalışan korumalı zamanlanmış görev, zamanı gelmiş ve henüz gönderilmemiş teslimatları bulup Web Push ile yollar. Teslimat gönderilirken atomik olarak işaretlenir; böylece aynı bildirim iki kez gitmez. Bu sunucu tarafı gönderim zorunludur: iOS PWA kapalıyken gelecekteki yerel bildirimleri cihaz üzerinde güvenilir biçimde planlamak mümkün değildir.

Bildirim metni örneği: `Akşam vaktinin üzerinden 15 dakika geçti.` Bildirime dokunulduğunda uygulama Namaz ekranına açılır.

## Veri modeli

- Kullanıcı ayarları: `prayer_location` (ülke, il, ilçe, sağlayıcı yer kimliği) ve tercih edilen saat dilimi.
- Namaz vakti: yer kimliği, tarih, imsak/öğle/ikindi/akşam/yatsı zamanları, sağlayıcı kaydı.
- Push aboneliği: kullanıcı kimliği, endpoint, anahtarlar, etkinlik durumu, son hata bilgisi.
- Bildirim teslimatı: namaz vakti kimliği, bildirim türü (`after_15m` veya `after_1h`), planlanan zaman, gönderilme zamanı, durum.

İl/ilçe değiştiğinde eski konuma ait gönderilmemiş teslimatlar iptal edilir, yeni konumun ayın kalan günleri için vakit ve teslimat kayıtları oluşturulur. Kullanıcı bildirim iznini kaldırırsa ilgili abonelik devre dışı bırakılır.

## Dayanıklılık ve güvenlik

Vakit yenileme isteği başarısız olursa son geçerli aylık kayıt korunur ve görev yeniden dener. Ay başındaki yenileme başarısız olursa, bildirim gönderici eksik gelecek vakitleri tespit edip yenileme ister. Geçersiz/sona ermiş push abonelikleri sunucu yanıtından sonra devre dışı bırakılır.

Push sağlayıcı anahtarları ve Diyanet API anahtarı yalnızca sunucuda ortam değişkeni olarak saklanır. Zamanlanmış görev, gizli bir anahtar veya barındırma platformunun cron kimlik doğrulamasıyla korunur.

## Test kapsamı

- İl/ilçe seçimi, kaydı ve ilgili aylık vakitlerin alınması.
- Her beş vakit için +15 dakika ve +1 saat teslimatının doğru oluşturulması.
- İki kez çalışan görevde tek bildirim gönderilmesi.
- İlçe değişiminde eski bekleyen teslimatların iptali.
- Geçersiz push aboneliğinin devre dışı kalması.
- Service worker, bildirim izin akışı ve iOS Ana Ekran PWA kurulum yönergeleri.
- Gerçek iPhone üzerinde, uygulama kapalıyken test push bildiriminin görünmesi.

## Kapsam dışı

Bu sürümde ezan sesi, kıble yönü, widget ve namaz takibi bulunmayacak. Bildirim türü tüm beş vakit için sabit olarak +15 dakika ve +1 saat olacak.
