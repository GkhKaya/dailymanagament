/**
 * Open Food Facts Türkiye Veri İçe Aktarım Scripti
 * 
 * Özellikler:
 * - Open Food Facts API üzerinden Türkiye marketlerinde satılan doğrulanmış popüler ürünleri çeker.
 * - Mevcut veritabanındaki ürünlerin üstüne yazmaz (korur).
 * - Porsiyon bilgisi (serving_size) varsa otomatik porsiyon olarak parse eder.
 * - Kullanıcının (gkhnkya0000@gmail.com) manuel eklediği ürünlerle örtüşenleri tekilleştirir (custom kopyayı siler).
 */

import mongoose from 'mongoose';
import { readFileSync } from 'fs';

function loadEnv() {
  try {
    const envFile = readFileSync('.env.local', 'utf8');
    for (const line of envFile.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch (e) {
    console.warn('⚠️ .env.local okunamadı');
  }
}

loadEnv();

// Helper for parsing serving size into weight in grams
function parseServingGram(servingStr) {
  if (!servingStr || typeof servingStr !== 'string') return null;
  const match = servingStr.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gr|gram|ml)/i);
  if (match) {
    const num = parseFloat(match[1].replace(',', '.'));
    if (num > 0 && num <= 2000) return Math.round(num);
  }
  return null;
}

// Helper to clean brand name
function cleanBrand(brandStr) {
  if (!brandStr) return null;
  const first = brandStr.split(/[,/]/)[0]?.trim();
  return first && first.length > 1 ? first : null;
}

async function fetchOffPage(page = 1, pageSize = 100) {
  const url = `https://world.openfoodfacts.org/api/v2/search?countries_tags_en=turkey&fields=code,product_name,product_name_tr,brands,nutriments,serving_size&page_size=${pageSize}&page=${page}&sort_by=unique_scans_n`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await new Promise(r => setTimeout(r, 1200 * attempt));
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'DailyM-NutritionManagement/1.0 (contact: gkhkaya00@gmail.com)'
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.products || [];
      }
      if (res.status === 503 || res.status === 429) {
        console.warn(`OFF API sayfa ${page} (deneme ${attempt}) HTTP ${res.status}, bekleniyor...`);
        await new Promise(r => setTimeout(r, 2500 * attempt));
        continue;
      }
    } catch (err) {
      console.error(`OFF API sayfa ${page} deneme ${attempt} hatası:`, err.message);
      await new Promise(r => setTimeout(r, 2500 * attempt));
    }
  }
  return [];
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI bulunamadı.');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.useDb('dailymanagament');
  const collection = db.collection('foodcaches');

  const targetUserId = '6a6114afcbefbca0ab79c274'; // gkhnkya0000@gmail.com

  console.log('📡 Open Food Facts Türkiye veri tabanından ürünler taranıyor...');

  const MAX_PAGES = 8; // Toplam 800 ürün çeker
  let totalFetched = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  let totalDeduplicated = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    console.log(`⏳ Sayfa ${page}/${MAX_PAGES} çekiliyor...`);
    const products = await fetchOffPage(page, 100);
    if (!products.length) break;

    totalFetched += products.length;

    for (const p of products) {
      const name = (p.product_name_tr || p.product_name || '').trim();
      if (!name || name.length < 2) continue;

      const nut = p.nutriments || {};
      const cal100 = nut['energy-kcal_100g'] ?? (nut['energy_100g'] ? nut['energy_100g'] / 4.184 : null);
      if (cal100 === null || typeof cal100 !== 'number' || cal100 <= 0 || cal100 > 950) continue;

      const pro100 = typeof nut.proteins_100g === 'number' ? Math.max(0, nut.proteins_100g) : 0;
      const carb100 = typeof nut.carbohydrates_100g === 'number' ? Math.max(0, nut.carbohydrates_100g) : 0;
      const fat100 = typeof nut.fat_100g === 'number' ? Math.max(0, nut.fat_100g) : 0;
      const sugar100 = typeof nut.sugars_100g === 'number' ? Math.max(0, nut.sugars_100g) : 0;
      const fiber100 = typeof nut.fiber_100g === 'number' ? Math.max(0, nut.fiber_100g) : 0;

      const brand = cleanBrand(p.brands);

      // Check if food already exists globally (NEVER overwrite)
      const existing = await collection.findOne({
        food_name: { $regex: `^${name}$`, $options: 'i' },
        brand_name: brand
      });

      if (existing) {
        totalSkipped++;
        continue;
      }

      // Build portions if serving_size exists
      const portions = [];
      const servingGram = parseServingGram(p.serving_size);
      if (servingGram) {
        portions.push({
          name: `1 Porsiyon (${p.serving_size})`,
          gram_weight: servingGram,
          label: p.serving_size
        });
      }

      const newDoc = {
        user_id: null, // Global
        food_name: name,
        brand_name: brand,
        unit_type: 'gram',
        per_unit: {
          calories: Math.round((cal100 / 100) * 1000) / 1000,
          protein_g: Math.round((pro100 / 100) * 1000) / 1000,
          carbs_g: Math.round((carb100 / 100) * 1000) / 1000,
          fat_g: Math.round((fat100 / 100) * 1000) / 1000,
          sugar_g: Math.round((sugar100 / 100) * 1000) / 1000,
          fiber_g: Math.round((fiber100 / 100) * 1000) / 1000
        },
        portions,
        source: 'openfoodfacts',
        search_tags: [name.toLowerCase(), brand ? brand.toLowerCase() : ''].filter(Boolean),
        created_at: new Date(),
        updated_at: new Date()
      };

      try {
        await collection.insertOne(newDoc);
        totalInserted++;

        // Deduplication against user custom items:
        // If this product matches an item previously created by target user, remove the custom duplicate!
        const customDuplicate = await collection.findOne({
          user_id: targetUserId,
          food_name: { $regex: `^${name}$`, $options: 'i' }
        });

        if (customDuplicate) {
          await collection.deleteOne({ _id: customDuplicate._id });
          console.log(`  🧹 Kullanıcının manuel kaydı doğrulanmış resmi kayıtla değiştirildi: "${customDuplicate.food_name}"`);
          totalDeduplicated++;
        }
      } catch (insertErr) {
        if (insertErr.code === 11000) {
          totalSkipped++;
        } else {
          console.error(`Ekleme hatası (${name}):`, insertErr.message);
        }
      }
    }
  }

  console.log('\n================== ÖZET ==================');
  console.log(`📥 Toplam taranan ürün: ${totalFetched}`);
  console.log(`✅ Yeni eklenen doğrulanmış ürün: ${totalInserted}`);
  console.log(`🛡️ Korunan / atlanan mevcut ürün: ${totalSkipped}`);
  console.log(`🧹 Kullanıcıdan tekilleştirilen kayıt: ${totalDeduplicated}`);

  const grandTotal = await collection.countDocuments();
  console.log(`📊 Güncel toplam FoodCache kayıt sayısı: ${grandTotal}`);

  await mongoose.disconnect();
}

main().catch(console.error);
