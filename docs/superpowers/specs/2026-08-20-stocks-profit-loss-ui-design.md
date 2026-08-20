# Borsa Kâr/Zarar Odaklı Arayüz Tasarımı

## Amaç

Borsa ekranını uygulamanın sade koyu tema ve token tabanlı tasarım diliyle uyumlu hâle getirmek. İlk bakışta portföyün güncel değeri ile kâr/zarar durumunu anlaşılır göstermek ve mobilde işlemleri hızlı erişilebilir tutmak.

## Bilgi hiyerarşisi

1. Ana özet kartı: portföyün güncel değeri, gerçekleşmemiş kâr/zarar tutarı, oranı ve yön işareti.
2. İkincil özetler: yatırılan maliyet ile gerçekleşen kâr/zarar.
3. Açık pozisyon listesi: sembol, lot, güncel değer ve pozisyon kâr/zararı.
4. Geçmiş işlem alanları: gerçekleşen işlemler ve emir geçmişi sekmelerden erişilebilir.

Başarı oranı, kazanan hisse ve hacim gibi ikincil metrikler ilk görünümden çıkarılır. Böylece ana karar verdiren bilgi olan kâr/zarar öne çıkar.

## Etkileşimler

- Ana eylem alış eklemektir; satış ikinci eylem olarak aynı alanda kalır.
- Her pozisyon kartında alış, satış ve güncel fiyat düzenleme hızlı erişilebilir olur.
- Emir/maliyet düzenleme, sembol düzenleme ve pozisyon silme kartta kalabalık yaratmadan bir detay menüsüne taşınır.
- Arama, yalnızca görünür sekmenin kayıtlarını filtreler.

## Responsive ve erişilebilirlik

- Mobil varsayılandır: tek sütun akış, iki küçük özet kartı ve tam genişlik arama alanı.
- Masaüstünde pozisyonlar kademeli çok sütunlu karta dönüşür.
- Yatay taşma olmadan, sekmeler küçük ekranlarda eşit genişlikte ve kısa etiketli sunulur.
- Tüm etkileşimli kontroller en az 44px dokunma hedefi, görünür odak halkası, aria etiketi ve renk dışı durum işareti taşır.

## Veri ve hata davranışı

Mevcut `getStockPortfolioAction` verisi ve modal bileşenleri korunur. Veriler yüklenirken mevcut spinner gösterilir. İstek hataları toast ile bildirilir; silme onayı ve başarılı işlemlerden sonra portföy yeniden alınır.

## Doğrulama

- Borsa veri kuralları için mevcut `npm run test:stocks` çalıştırılır.
- Tür, lint ve üretim derlemesi için `npm run lint` ile `npm run build` çalıştırılır.
- Görsel kontrol masaüstü ve dar mobil genişlikte yapılır.
