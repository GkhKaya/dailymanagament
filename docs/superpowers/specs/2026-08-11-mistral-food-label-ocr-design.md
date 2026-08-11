# Mistral OCR ile Besin Etiketi Okuma

## Amaç

Manuel yemek ekleme ekranında kullanıcı bir ürün etiketi fotoğrafı seçebilsin. Fotoğraf sunucu üzerinden Mistral OCR’a gönderilecek ve ürün adı, marka adı ile etiketteki 100 g başına kalori, karbonhidrat, protein ve yağ değerleri forma otomatik doldurulacak.

## Akış

1. Kullanıcı manuel ekleme panelinde “Etiket fotoğrafından doldur” alanından kamera veya galeriyi açar.
2. İstemci görseli `multipart/form-data` olarak `/api/food/ocr` rotasına gönderir.
3. Route Handler görsel türü/boyutu doğrular, base64 data URL oluşturur ve Mistral `mistral-ocr-latest` document annotation API’sini çağırır.
4. Annotation çıktısı yalnızca beklenen besin şemasına göre doğrulanır; değerler 100 g bazında forma yazılır. Birim `gram`, miktar `100` olur.
5. Kullanıcı değerleri kontrol edip mevcut “Manuel Kaydet” düğmesiyle kaydeder. Fotoğraf kalıcı olarak saklanmaz.

## Hata ve güvenlik

- `MISTRAL_API_KEY` yoksa açık bir yapılandırma hatası döndürülür.
- Yalnızca JPEG, PNG, WEBP ve AVIF; en fazla 10 MB kabul edilir.
- Eksik veya negatif besin değerleri OCR hatası sayılır; form bozulmadan manuel girişe dönülür.
- Mistral anahtarı yalnızca sunucu ortamında kullanılır.

## UI

Manuel formun üstünde kamera ikonlu, dokunma alanı en az 44 px olan bir yükleme düğmesi bulunur. Yükleme sırasında spinner ve “Etiket okunuyor…” durumu gösterilir; sonuç geldiğinde “100 g değerleri dolduruldu” geri bildirimi verilir. Yeni metinler Türkçe locale dosyasına eklenir.

## Test kapsamı

- Annotation JSON’unun sayısal değerleri güvenli şekilde normalize etmesi.
- Eksik/negatif değerlerin reddedilmesi.
- Route Handler’ın dosya türü, boyutu ve API anahtarı doğrulaması.
- TypeScript, lint ve production build doğrulaması.
