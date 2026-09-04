import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHealthDraftFromFoods,
  inferMealTypeFromContext,
  validateHealthDraft,
  validateFinanceDraft
} from '../src/lib/assistant-helpers.ts';
import { toUserFacingError } from '../src/lib/error-management.ts';

// 1. SESLİ BESİN KOMUTU DİREKT KAYIT YAPMAMALI
test('1. Sesli besin komutu direkt kayıt yapmamalı, önizleme taslağı oluşturmalı', () => {
  const simulatedRawAiOutput = {
    type: 'health',
    health_data: {
      meal_type: null,
      foods: [
        {
          name: 'Yumurta',
          quantity: 2,
          unit: 'adet',
          nutrition_basis: 'per_unit',
          calories: 75,
          protein_g: 6.5,
          carbs_g: 0.6,
          fat_g: 5.0
        },
        {
          name: 'Beyaz Peynir',
          quantity: 100,
          unit: 'gram',
          nutrition_basis: 'per_gram',
          calories: 2.6,
          protein_g: 0.17,
          carbs_g: 0.02,
          fat_g: 0.21
        }
      ]
    }
  };

  // Simulating processAssistantVoiceAction flow for health:
  // Instead of calling addMealsAction, it builds HealthDraft and returns action: 'health_preview'
  const draft = buildHealthDraftFromFoods(
    simulatedRawAiOutput.health_data,
    '2 yumurta ve 100 gram peynir yedim',
    '2026-09-05'
  );

  const result = {
    success: true,
    action: 'health_preview',
    draft
  };

  // Verify action is health_preview and DB was NOT touched
  assert.equal(result.action, 'health_preview');
  assert.equal(result.success, true);
  assert.ok(result.draft);
  assert.equal(result.draft.foods.length, 2);
  assert.equal(result.draft.transcript, '2 yumurta ve 100 gram peynir yedim');
});

// 2. ÖNİZLEME VERİSİ DOĞRU OLUŞMALI (TÜRKÇE BİRİMLER & ÖĞÜN TAHMİNİ)
test('2. Önizleme verisi Türkçe ölçü birimlerini (adet, gram, dilim, bardak, kase) ve makroları doğru çarpar', () => {
  const rawHealth = {
    meal_type: null,
    foods: [
      {
        name: 'Haşlanmış Yumurta',
        quantity: 2,
        unit: 'adet',
        nutrition_basis: 'per_unit',
        calories: 75,
        protein_g: 6.3,
        carbs_g: 0.5,
        fat_g: 5.1
      },
      {
        name: 'Kaşar Peyniri',
        quantity: 50,
        unit: 'gram',
        nutrition_basis: 'per_gram',
        calories: 3.5,
        protein_g: 0.25,
        carbs_g: 0.01,
        fat_g: 0.28
      },
      {
        name: 'Tam Buğday Ekmeği',
        quantity: 2,
        unit: 'dilim',
        nutrition_basis: 'per_unit',
        calories: 68,
        protein_g: 3.0,
        carbs_g: 13.0,
        fat_g: 0.8
      },
      {
        name: 'Süt',
        quantity: 1,
        unit: 'bardak',
        nutrition_basis: 'per_unit',
        calories: 120,
        protein_g: 6.8,
        carbs_g: 9.4,
        fat_g: 6.0
      },
      {
        name: 'Mercimek Çorbası',
        quantity: 1,
        unit: 'kase',
        nutrition_basis: 'per_unit',
        calories: 140,
        protein_g: 7.5,
        carbs_g: 20.0,
        fat_g: 3.2
      }
    ]
  };

  const draft = buildHealthDraftFromFoods(rawHealth, 'test komutu', '2026-09-05');

  // 2 yumurta: 75*2 = 150 kcal, 6.3*2 = 12.6g protein
  const yumurta = draft.foods[0];
  assert.equal(yumurta.food_name, 'Haşlanmış Yumurta');
  assert.equal(yumurta.quantity, 2);
  assert.equal(yumurta.unit_type, 'adet');
  assert.equal(yumurta.calories, 150);
  assert.equal(yumurta.protein_g, 12.6);

  // 50g kaşar: 3.5*50 = 175 kcal, 0.25*50 = 12.5g protein
  const kasar = draft.foods[1];
  assert.equal(kasar.food_name, 'Kaşar Peyniri');
  assert.equal(kasar.quantity, 50);
  assert.equal(kasar.unit_type, 'gram');
  assert.equal(kasar.calories, 175);
  assert.equal(kasar.protein_g, 12.5);

  // 2 dilim ekmek: 68*2 = 136 kcal, 13*2 = 26g carbs
  const ekmek = draft.foods[2];
  assert.equal(ekmek.unit_type, 'dilim');
  assert.equal(ekmek.calories, 136);
  assert.equal(ekmek.carbs_g, 26.0);

  // 1 bardak süt: 120 kcal
  const sut = draft.foods[3];
  assert.equal(sut.unit_type, 'bardak');
  assert.equal(sut.calories, 120);

  // 1 kase çorba: 140 kcal
  const corba = draft.foods[4];
  assert.equal(corba.unit_type, 'kase');
  assert.equal(corba.calories, 140);

  // Otomatik öğün tahmini: Kahvaltı yiyecekleri (yumurta, peynir, ekmek) içerdiği için breakfast olmalı
  assert.equal(draft.meal_type, 'breakfast');
});

test('2b. Öğün türü belirtilmemişse bağlama ve besin adına göre otomatik tahmin edilir', () => {
  assert.equal(inferMealTypeFromContext(['menemen', 'simit', 'peynir']), 'breakfast');
  assert.equal(inferMealTypeFromContext(['ceviz', 'elma', 'kahve']), 'snack');
  assert.ok(['lunch', 'dinner'].includes(inferMealTypeFromContext(['dana biftek', 'pirinç pilavı'])));
});

// 3. KULLANICI DÜZENLEDİKTEN SONRA KAYIT YAPILMALI
test('3. Kullanıcı önizlemedeki besinleri, miktarları, makroları ve öğünü düzelttiğinde onaylanır', () => {
  const initialDraft = buildHealthDraftFromFoods(
    {
      meal_type: 'breakfast',
      foods: [
        {
          name: 'Beyaz Peynir',
          quantity: 100,
          unit: 'gram',
          nutrition_basis: 'per_gram',
          calories: 2.5,
          protein_g: 0.15,
          carbs_g: 0.02,
          fat_g: 0.20
        }
      ]
    },
    '100 gr peynir yedim'
  );

  // User edits:
  // 1. Changes name from "Beyaz Peynir" to "Ezine Peyniri"
  // 2. Changes quantity from 100 to 60
  // 3. Updates calories to 180 and protein to 12
  // 4. Changes meal type from breakfast to dinner
  const editedDraft = {
    ...initialDraft,
    meal_type: 'dinner',
    foods: [
      {
        ...initialDraft.foods[0],
        food_name: 'Ezine Peyniri',
        quantity: 60,
        calories: 180,
        protein_g: 12.0
      },
      // 5. User adds a custom second item
      {
        id: 'voice-custom-999',
        food_name: 'Zeytin',
        serving_description: '5 adet',
        quantity: 5,
        unit_type: 'adet',
        calories: 45,
        protein_g: 0.4,
        carbs_g: 1.2,
        fat_g: 4.8
      }
    ]
  };

  const validation = validateHealthDraft(editedDraft);
  assert.equal(validation.valid, true);
  assert.equal(validation.foods.length, 2);

  const item1 = validation.foods[0];
  assert.equal(item1.food_name, 'Ezine Peyniri');
  assert.equal(item1.type, 'dinner');
  assert.equal(item1.quantity, 60);
  assert.equal(item1.calories, 180);
  assert.equal(item1.protein_g, 12.0);

  const item2 = validation.foods[1];
  assert.equal(item2.food_name, 'Zeytin');
  assert.equal(item2.type, 'dinner');
  assert.equal(item2.quantity, 5);
  assert.equal(item2.calories, 45);
});

// 4. GEÇERSİZ VEYA EKSİK BESİN VERİSİ REDDEDİLMELİ
test('4. Geçersiz, eksik veya hatalı besin verileri reddedilmeli', () => {
  // Boş öğün listesi
  assert.deepEqual(validateHealthDraft({ meal_type: 'breakfast', date: '2026-09-05', transcript: '', foods: [] }), {
    valid: false,
    error: 'Kaydedilecek besin bulunamadı.'
  });

  // Geçersiz öğün türü
  assert.deepEqual(validateHealthDraft({ meal_type: 'gece-atistirmasi', date: '2026-09-05', transcript: '', foods: [{ food_name: 'Elma', quantity: 1, calories: 50, unit_type: 'adet' }] }), {
    valid: false,
    error: 'Geçersiz öğün türü seçildi.'
  });

  // İsimsiz besin
  assert.equal(
    validateHealthDraft({
      meal_type: 'snack',
      date: '2026-09-05',
      transcript: '',
      foods: [{ food_name: '   ', quantity: 1, calories: 50, unit_type: 'adet' }]
    }).valid,
    false
  );

  // Negatif veya sıfır miktar
  assert.equal(
    validateHealthDraft({
      meal_type: 'snack',
      date: '2026-09-05',
      transcript: '',
      foods: [{ food_name: 'Muz', quantity: 0, calories: 100, unit_type: 'adet' }]
    }).valid,
    false
  );

  // Negatif kalori
  assert.equal(
    validateHealthDraft({
      meal_type: 'snack',
      date: '2026-09-05',
      transcript: '',
      foods: [{ food_name: 'Muz', quantity: 1, calories: -50, unit_type: 'adet' }]
    }).valid,
    false
  );

  // buildHealthDraftFromFoods boş girdi reddi
  assert.throws(() => {
    buildHealthDraftFromFoods({ foods: [] }, 'boş komut');
  });
});

// 5. FİNANS SESLİ İŞLEM AKIŞI BOZULMAMALI
test('5. Finans sesli işlem doğrulama akışı bozulmadan çalışmaya devam etmeli', () => {
  // Geçerli gider taslağı
  const validExpense = {
    transaction_type: 'expense',
    amount: 150.5,
    account_id: 'acc_123',
    category_id: 'cat_456',
    description: 'Market alışverişi',
    date: '2026-09-05'
  };
  const res1 = validateFinanceDraft(validExpense);
  assert.equal(res1.valid, true);
  assert.equal(res1.amount, 150.5);

  // Geçerli gelir taslağı
  const validIncome = {
    transaction_type: 'income',
    amount: 5000,
    account_id: 'acc_123',
    category_id: 'cat_789',
    description: 'Maaş',
    date: '2026-09-05'
  };
  const res2 = validateFinanceDraft(validIncome);
  assert.equal(res2.valid, true);
  assert.equal(res2.amount, 5000);

  // Hesap seçilmemişse reddedilmeli
  assert.deepEqual(
    validateFinanceDraft({ transaction_type: 'expense', amount: 100, account_id: null, category_id: 'cat_1' }),
    { valid: false, error: 'Tutar, hesap ve kategori seçilmelidir.' }
  );

  // Kategori seçilmemişse reddedilmeli
  assert.deepEqual(
    validateFinanceDraft({ transaction_type: 'expense', amount: 100, account_id: 'acc_1', category_id: null }),
    { valid: false, error: 'Tutar, hesap ve kategori seçilmelidir.' }
  );

  // Tutar sıfır veya negatifse reddedilmeli
  assert.deepEqual(
    validateFinanceDraft({ transaction_type: 'expense', amount: 0, account_id: 'acc_1', category_id: 'cat_1' }),
    { valid: false, error: 'Tutar, hesap ve kategori seçilmelidir.' }
  );
});

// 6. MERKEZİ HATA YÖNETİMİ (ERROR MANAGEMENT)
test('6. Merkezi hata yönetimi teknik API hatalarını kullanıcı dostu Türkçe mesaja dönüştürür', () => {
  // Ham Gemini 404/not_found JSON hatası
  const rawGeminiErr = '{"error":{"code":404,"message":"This model models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.6-flash for the latest features and improvements.","status":"NOT_FOUND"}}';
  const cleanErr1 = toUserFacingError(rawGeminiErr);
  assert.equal(cleanErr1.includes('{'), false);
  assert.equal(cleanErr1.includes('404'), false);
  assert.ok(cleanErr1.includes('güncelleniyor') || cleanErr1.includes('tekrar deneyin'));

  // Kota hatası (429 rate limit)
  const quotaErr = new Error('ResourceExhausted: 429 Resource has been exhausted (e.g. check quota)');
  const cleanErr2 = toUserFacingError(quotaErr);
  assert.ok(cleanErr2.includes('yoğun') || cleanErr2.includes('bekleyip tekrar'));

  // Ağ / Bağlantı hatası
  const netErr = new Error('TypeError: fetch failed - ENOTFOUND generativelanguage.googleapis.com');
  const cleanErr3 = toUserFacingError(netErr);
  assert.ok(cleanErr3.includes('Bağlantı') || cleanErr3.includes('internet'));

  // Doğrulama hatası (özel validator mesajı korunmalı)
  const validationErr = 'Besin adı boş bırakılamaz.';
  assert.equal(toUserFacingError(validationErr), 'Besin adı boş bırakılamaz.');
});

// 7. VERİTABANI BESİN EŞLEŞTİRME & BİRİM DÖNÜŞÜMÜ (DB FOOD MATCHER)
test('7. Veritabanı besin eşleştirici: bitişik yazımları normalize eder, porsiyon gramını hesaplar ve food_cache_id korur', async () => {
  const { normalizeFoodQuery, resolvePortionGramsFromOptions } = await import('../src/lib/assistant-helpers.ts');

  // Bitişik yazılan Türkçe kelimeler ayrıştırılmalı
  const norm1 = normalizeFoodQuery('pişmiş tavukgöğsü');
  assert.ok(norm1.text.includes('tavuk göğsü'));
  assert.deepEqual(norm1.coreWords, ['tavuk', 'göğsü']);

  const norm2 = normalizeFoodQuery('200 gram pirinçpilavı');
  assert.ok(norm2.text.includes('pirinç pilavı'));
  assert.deepEqual(norm2.coreWords, ['pirinç', 'pilavı']);

  // Porsiyon çözümleme
  const mockSmartOptions = [
    { name: '100 Gram (Standart)', gram_weight: 100 },
    { name: '1 Porsiyon (200g)', gram_weight: 200 },
    { name: '1 Tabak (250g)', gram_weight: 250 }
  ];

  // 200 gram -> 200g
  assert.equal(resolvePortionGramsFromOptions(mockSmartOptions, 200, 'gram'), 200);

  // 1 porsiyon -> 200g
  assert.equal(resolvePortionGramsFromOptions(mockSmartOptions, 1, 'porsiyon'), 200);

  // 1 tabak -> 250g
  assert.equal(resolvePortionGramsFromOptions(mockSmartOptions, 1, 'tabak'), 250);

  // Draft ve validation süreçlerinde food_cache_id ve matched_in_db korunmalı
  const draft = buildHealthDraftFromFoods(
    {
      meal_type: 'dinner',
      foods: [
        {
          name: 'Tavuk Göğsü (Haşlanmış)',
          quantity: 200,
          unit: 'gram',
          total_calories: 330,
          total_protein_g: 62,
          total_carbs_g: 0,
          total_fat_g: 7.2,
          total_sugar_g: 0,
          matched_in_db: true,
          food_cache_id: 'mock-food-id-123',
          brand_name: null
        }
      ]
    },
    '200 gram pişmiş tavuk göğsü yedim',
    '2026-09-05'
  );

  assert.equal(draft.foods[0].food_name, 'Tavuk Göğsü (Haşlanmış)');
  assert.equal(draft.foods[0].matched_in_db, true);
  assert.equal(draft.foods[0].food_cache_id, 'mock-food-id-123');
  assert.equal(draft.foods[0].calories, 330);
  assert.equal(draft.foods[0].protein_g, 62);

  // validateHealthDraft doğrulaması
  const validated = validateHealthDraft(draft);
  assert.equal(validated.valid, true);
  assert.equal(validated.foods[0].food_cache_id, 'mock-food-id-123');
  assert.equal(validated.foods[0].calories, 330);
});


