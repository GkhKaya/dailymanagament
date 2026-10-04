# Serbest Metinle AI Öğün Hesaplama

## Amaç

Kullanıcı, hazırladığı veya tükettiği yiyeceği doğal dilde anlatır. Sistem; malzemeleri, paket/adet/gram/tabak gibi miktarları ve tüketilen oranı yorumlayıp besin değerlerini hesaplar. Sonuç, kullanıcı onayıyla seçilen günlük öğüne eklenir.

Örnekler:

- `1 paket puding, yarım paket petibör ile yaptığım tatlının dörtte birini yedim`
- `2,5 tabak ezogelin çorbası içtim`
- `250 gram tavuk, 1 bardak pirinçle yaptığım yemeğin yarısını yedim`

## Kullanıcı Akışı

1. Mevcut besin ekleme formuna `AI ile hesapla` bölümü eklenir.
2. Kullanıcı öğünü, günü ve serbest metni seçer/yazar.
3. `Veritabanını kullan` anahtarı görünür:
   - Kapalıyken AI hiçbir `FoodCache` veya kayıtlı besin sorgusu yapmaz; yalnızca model tahmini kullanır.
   - Açıkken AI, yalnızca mevcut görünür besin verilerini referans olarak kullanabilir. Yeni FoodCache/SavedFood/recipe kaydı kesinlikle oluşturulmaz veya güncellenmez.
4. AI malzemeleri, toplam tarifi, tüketim miktarını/oranını ve besin değerlerini çıkarır.
5. Arayüz; yemek adı, tüketim açıklaması, kalori ve makroları düzenlenebilir önizleme olarak gösterir.
6. Kullanıcı `Öğüne ekle` dediğinde yalnızca `DailyLog.meals` içine besin kaydı eklenir. `food_cache_id` boş kalır.

## Teknik Tasarım

- Yeni bir API endpoint'i, tek besin Gemini endpoint'inden ayrıdır ve doğal dil tarif/porsiyon şeması kullanır.
- Endpoint istek alanları: `prompt`, `useDatabase`.
- Cevap: normalize edilmiş yemek adı, tüketim açıklaması, toplam kalori/protein/karbonhidrat/yağ/şeker ve AI tahmini uyarısı.
- `useDatabase: false` yolunda MongoDB'ye bağlanılmaz ve FoodCache modeli içe aktarılmaz.
- `useDatabase: true` yolunda yalnızca okuma yapılır; uygun mevcut kayıtların makroları model bağlamına verilir. Yazma işlemi bulunmaz.
- Öğün kaydı mevcut `addMealAction` üzerinden yapılır; hedef gün ve öğün formdan gelir.

## Güvenlik ve Doğrulama

- Giriş 1-1.500 karakterle sınırlandırılır.
- Oturum gereklidir.
- AI yanıtı şema ile doğrulanır; negatif, NaN ve aşırı değerler reddedilir.
- AI'nın besin değerleri tahmini olduğu önizlemede açıkça belirtilir.
- Kullanıcı onayı olmadan günlük kayıt yazılmaz.

## Testler

- Serbest metin oranlarını ve virgüllü ondalık miktarları taşıyan istek doğrulaması.
- `useDatabase: false` akışında FoodCache sorgusu/yazımı yapılmadığına dair birim testi.
- `useDatabase: true` akışının yalnızca okuma bağlamı üretmesi.
- Onaylanan sonucun DailyLog'a `food_cache_id: null` ile eklenmesi.
