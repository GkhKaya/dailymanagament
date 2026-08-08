# Finans Borcu, Hesap Transferi ve AI Sağlayıcıları

## Amaç

Kredi kartı harcamalarında `current_debt` alanını işlem anında güncel tutmak; kredi kartı hariç hesaplar arasında transfer yapmak; transferleri gelir/gider toplamlarından hariç tutmak; AI yemek aramasında Gemini ana, OpenRouter yedek sağlayıcı olacak şekilde anahtarları ortam değişkenlerinden kullanmak.

## Tasarım

### Kredi kartı borcu

`addTransactionAction` gider işlemi kredi kartına aitse hesabın bakiyesini ve `credit_card_details.current_debt` değerini işlem tutarı kadar artıracak. Gelir işlemi kredi kartında destekleniyorsa borç aynı tutarda azalacak; borç sıfırın altına inmeyecek. İşlem silme ve düzenleme akışları eski etkinin tersini uygulayıp yeni etkiyi uygulayacak. Böylece hesap düzenleme ekranı veritabanındaki gerçek güncel borcu gösterecek.

### Hesap transferi

Yeni `transfer` işlem türü eklenecek. Transfer yalnızca `cash`, `bank_account` ve `debit_card` hesapları arasında yapılabilecek; kredi kartı kaynak veya hedef olamayacak. Kaynak bakiyesi azalacak, hedef bakiyesi artacak. İşlem kaydı kaynak hesapta tutulacak ve `related_account_id` hedef hesabı gösterecek. `show_as_expense` ve gelir/gider analizleri transferi dışlayacak. Kaynak ve hedef aynı olamayacak, tutar pozitif olmalı ve kaynakta yeterli bakiye bulunmalı.

Arayüzde hesap yönetimi bölümünden açılan bir transfer formu olacak: kaynak, hedef, tutar, tarih ve açıklama. Başarılı transfer sonrası hesap listesi ve dashboard yenilenecek.

### AI

Gemini ana sağlayıcı olarak kalacak. Gemini kullanılamazsa mevcut fallback mantığıyla OpenRouter denenecek. Anahtarlar `.env.local` içindeki `GEMINI_API_KEY` ve `OPENROUTER_API_KEY` değişkenlerinden okunacak; kaynak koda veya istemciye gömülmeyecek. API hata mesajları kullanıcıya güvenli ve anlaşılır dönecek.

## Test kapsamı

- Kredi kartı gideri borcu ve bakiyeyi artırır.
- Kredi kartı işlemi silinince borç geri alınır.
- Transfer kaynak/hedef bakiyelerini doğru değiştirir.
- Transfer kredi kartını reddeder ve gelir/gider hesabına girmez.
- Geçersiz tutar, aynı hesap ve yetersiz bakiye reddedilir.
- AI sağlayıcı anahtarları ortam değişkenlerinden okur; Gemini başarısız olduğunda OpenRouter fallback çalışır.

## Kapsam dışı

Geçmiş hatalı kredi kartı işlemlerini otomatik veri migrasyonuyla düzeltmek bu değişikliğin dışında. Gerekirse ayrıca bir bakım komutuyla yapılabilir.
