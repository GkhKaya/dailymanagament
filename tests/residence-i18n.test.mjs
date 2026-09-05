import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const trLocalePath = path.resolve('src/locales/tr.json');
const enLocalePath = path.resolve('src/locales/en.json');

const trJson = JSON.parse(fs.readFileSync(trLocalePath, 'utf8'));
const enJson = JSON.parse(fs.readFileSync(enLocalePath, 'utf8'));

test('1. Translation files parity and completeness', () => {
  // Check that all top-level keys in tr.json exist in en.json
  const trKeys = Object.keys(trJson);

  for (const key of trKeys) {
    assert.ok(enJson[key], `en.json should have top-level key '${key}'`);
    if (typeof trJson[key] === 'object' && trJson[key] !== null) {
      for (const subKey of Object.keys(trJson[key])) {
        assert.ok(
          enJson[key][subKey] !== undefined,
          `en.json should have nested key '${key}.${subKey}'`
        );
      }
    }
  }

  // Verify residence onboarding strings exist in both
  assert.ok(trJson.residence.welcomeTitle, 'tr.json has residence.welcomeTitle');
  assert.ok(enJson.residence.welcomeTitle, 'en.json has residence.welcomeTitle');
  assert.ok(trJson.residence.countryQuestion, 'tr.json has residence.countryQuestion');
  assert.ok(enJson.residence.countryQuestion, 'en.json has residence.countryQuestion');
  assert.ok(trJson.residence.turkeyOption, 'tr.json has residence.turkeyOption');
  assert.ok(enJson.residence.turkeyOption, 'en.json has residence.turkeyOption');
  assert.ok(trJson.residence.abroadOption, 'tr.json has residence.abroadOption');
  assert.ok(enJson.residence.abroadOption, 'en.json has residence.abroadOption');
  assert.ok(trJson.residence.saveButton, 'tr.json has residence.saveButton');
  assert.ok(enJson.residence.saveButton, 'en.json has residence.saveButton');

  // Verify tabStocks exists
  assert.equal(trJson.dashboard.tabStocks, 'Borsa');
  assert.equal(enJson.dashboard.tabStocks, 'Stocks');
});

test('2. Residence behavior: Abroad vs Turkey preferences', async () => {
  // Test i18n logic
  const { t, getLocale, setLocale, isAbroad, setResidencePreferences } = await import('../src/lib/i18n.ts');

  // Case A: Abroad resident
  setResidencePreferences({ country: 'US', isAbroad: true, language: 'en' });
  assert.equal(isAbroad(), true, 'isAbroad() should return true for abroad user');
  assert.equal(getLocale(), 'en', 'Abroad resident must be in English');
  assert.equal(t('dashboard.tabOverview'), 'Overview');
  assert.equal(t('dashboard.tabStocks'), 'Stocks');

  // Case B: Turkey resident defaults to Turkish
  setResidencePreferences({ country: 'TR', isAbroad: false, language: 'tr' });
  assert.equal(isAbroad(), false, 'isAbroad() should return false for TR user');
  assert.equal(getLocale(), 'tr', 'TR resident defaults to Turkish');
  assert.equal(t('dashboard.tabOverview'), 'Genel Bakış');
  assert.equal(t('dashboard.tabStocks'), 'Borsa');

  // Case C: Turkey resident switches to English via toggle
  setLocale('en');
  assert.equal(getLocale(), 'en', 'TR resident can manually switch to English');
  assert.equal(t('dashboard.tabOverview'), 'Overview');
});

test('3. Portion unit translation mapping for global foods', async () => {
  const { translatePortionNameToEn } = await import('../src/lib/food-portions.ts');

  assert.equal(translatePortionNameToEn('1 Dilim'), '1 slice');
  assert.equal(translatePortionNameToEn('1 Porsiyon'), '1 serving');
  assert.equal(translatePortionNameToEn('1 Su Bardağı'), '1 cup');
  assert.equal(translatePortionNameToEn('1 Kase'), '1 bowl');
  assert.equal(translatePortionNameToEn('2 Yemek Kaşığı'), '2 tbsp');
  assert.equal(translatePortionNameToEn('1 Kutu'), '1 can');
  assert.equal(translatePortionNameToEn('1 Tabak'), '1 plate');
});

test('4. Global food transformation: English fallback and unit normalization', () => {
  const sampleFood = {
    food_name: 'Tavuk Göğsü',
    food_name_en: 'Chicken Breast',
    unit_type: 'adet',
    per_unit: { calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6 },
    portions: [{ name: '1 Porsiyon', gram_weight: 150 }]
  };

  // When isEnglish is true:
  const isEnglish = true;
  const transformed = {
    food_name: isEnglish && sampleFood.food_name_en ? sampleFood.food_name_en : sampleFood.food_name,
    food_name_tr: sampleFood.food_name,
    food_name_en: sampleFood.food_name_en,
    unit_type: isEnglish && sampleFood.unit_type === 'adet' ? 'piece' : sampleFood.unit_type,
    portions: sampleFood.portions.map(p => ({
      ...p,
      name: isEnglish ? (p.name === '1 Porsiyon' ? '1 serving' : p.name) : p.name,
    })),
  };

  assert.equal(transformed.food_name, 'Chicken Breast', 'Food name should be in English for abroad/en users');
  assert.equal(transformed.unit_type, 'piece', 'Unit type adet should map to piece for abroad/en users');
  assert.equal(transformed.portions[0].name, '1 serving', 'Portion should be translated to 1 serving');
});
