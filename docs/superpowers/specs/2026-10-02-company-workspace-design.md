# Şirketim Alanı Tasarımı

## Amaç

Kullanıcıların birden fazla şirket oluşturabildiği, şirket gelir-giderlerini kişisel cüzdandan tamamen ayrı yönettiği ve başka kayıtlı kullanıcıları uygulama içi davetle admin yaptığı bir alan oluşturmak.

## Yetki modeli

- Şirket sahibi şirketi oluşturur, siler, admin davet eder ve admin çıkarır.
- Admin şirket hesaplarını, kategorilerini ve gelir-gider kayıtlarını yönetir.
- Admin şirketi silemez, sahipliği değiştiremez veya admin yönetemez.
- Her Server Action oturumu ve şirket üyeliğini yeniden doğrular.

## Veri modeli

Şirket, üyelik, davet, hesap, kategori ve işlem kayıtları kişisel finans koleksiyonlarından ayrı tutulur. İşlemler `created_by` ve `updated_by` alanlarıyla izlenir. Hesap bakiyesi açılış bakiyesi ile gelir-giderlerin toplamından hesaplanır.

## Kullanıcı deneyimi

`/company` sayfasında şirket seçici, şirket oluşturma, özet kartları, tarih filtresi, hesap/kategori yönetimi, işlem formu, işlem geçmişi, adminler ve uygulama içi davetler bulunur. Arayüz DailyM koyu cam kart, lime vurgu, Lucide ikon ve mobil öncelikli tasarım dilini kullanır.

## Hata durumları

Kayıtsız e-posta, tekrarlanan davet, mevcut üyeyi davet etme, yetkisiz işlem, geçersiz tutar ve şirket verileri arasında çapraz erişim sunucuda reddedilir.

## Doğrulama

Rol matrisi birim testleri, davet durumu kuralları, tarih filtresi ve üretim derlemesi doğrulanır.
