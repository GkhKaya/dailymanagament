/**
 * FoodCache koleksiyonunu şeker değeri girilmek üzere JSON'a aktarır.
 *
 * Çalıştırma:
 *   npm run export:food-sugar
 *
 * `per_unit.sugar_g` her kayıtta başlangıçta 0'dır.
 * Gram bazlı ürünlerde değer 1 gram, diğer birimlerde 1 birim içindir.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { MongoClient } from 'mongodb';

const DB_NAME = 'dailymanagament';
const OUTPUT_DIRECTORY = 'data';
const OUTPUT_FILE = `${OUTPUT_DIRECTORY}/food-cache-sugar.json`;

function loadEnv() {
  try {
    const envFile = readFileSync('.env.local', 'utf8');
    for (const line of envFile.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex < 0) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    console.warn('⚠️ .env.local okunamadı, mevcut ortam değişkenleri kullanılıyor.');
  }
}

function toExportRecord(food) {
  return {
    id: food._id.toString(),
    food_name: food.food_name,
    food_name_en: food.food_name_en ?? null,
    brand_name: food.brand_name ?? null,
    unit_type: food.unit_type,
    per_unit: {
      calories: food.per_unit?.calories ?? 0,
      protein_g: food.per_unit?.protein_g ?? 0,
      carbs_g: food.per_unit?.carbs_g ?? 0,
      fat_g: food.per_unit?.fat_g ?? 0,
      fiber_g: food.per_unit?.fiber_g ?? 0,
      sugar_g: 0
    },
    source: food.source ?? null,
    ai_provider: food.ai_provider ?? null,
    nutrition_basis: food.nutrition_basis ?? null
  };
}

async function main() {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI bulunamadı. .env.local dosyasını kontrol edin.');

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const foods = await client
      .db(DB_NAME)
      .collection('foodcaches')
      .find({})
      .sort({ food_name: 1, brand_name: 1 })
      .toArray();

    const payload = {
      exported_at: new Date().toISOString(),
      sugar_field: 'per_unit.sugar_g',
      sugar_basis: 'Gram ürünlerde 1 gram, diğer birimlerde 1 birim başına gram şeker.',
      foods: foods.map(toExportRecord)
    };

    mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
    writeFileSync(OUTPUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    console.log(`✅ ${foods.length} kayıt ${OUTPUT_FILE} dosyasına yazıldı.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(`❌ Dışa aktarma başarısız: ${error.message}`);
  process.exitCode = 1;
});
