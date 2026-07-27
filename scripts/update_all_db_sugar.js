const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!MONGODB_URI) {
  console.error("HATA: MONGODB_URI bulunamadı.");
  process.exit(1);
}

const FoodCacheSchema = new mongoose.Schema({
  food_name: String,
  food_name_en: String,
  unit_type: String,
  per_unit: {
    calories: Number,
    protein_g: Number,
    carbs_g: Number,
    fat_g: Number,
    sugar_g: Number,
    fiber_g: Number
  },
  brand_name: String,
  source: String,
  search_tags: [String]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const FoodCache = mongoose.models.FoodCache || mongoose.model('FoodCache', FoodCacheSchema);

const LocalFoodSchema = new mongoose.Schema({
  name: String,
  category: String,
  units: [{
    unit_name: String,
    calories: Number,
    protein_g: Number,
    carbs_g: Number,
    fat_g: Number,
    sugar_g: Number,
    fiber_g: Number
  }]
});

const LocalFood = mongoose.models.LocalFood || mongoose.model('LocalFood', LocalFoodSchema);

// Bilinen temel besinlerin şeker oranları (100g veya 1 adet başına şeker g)
const KNOWN_SUGARS = {
  "elma": { sugar_ratio: 0.75 }, // karb'ın %75'i şeker
  "muz": { sugar_ratio: 0.54 },
  "portakal": { sugar_ratio: 0.80 },
  "çilek": { sugar_ratio: 0.63 },
  "karpuz": { sugar_ratio: 0.81 },
  "kuru üzüm": { sugar_ratio: 0.75 },
  "çikolata": { sugar_ratio: 0.87 },
  "nutella": { sugar_ratio: 0.98 },
  "baklava": { sugar_ratio: 0.76 },
  "kola": { sugar_ratio: 1.0 },
  "yoğurt": { sugar_ratio: 0.90 },
  "bal": { sugar_ratio: 0.99 },
  "reçel": { sugar_ratio: 0.87 },
  "bisküvi": { sugar_ratio: 0.56 },
  "süt": { sugar_ratio: 1.0 }, // laktoz
  "dondurma": { sugar_ratio: 0.87 },
  "hurma": { sugar_ratio: 0.88 },
  "kayısı": { sugar_ratio: 0.84 },
  "helva": { sugar_ratio: 0.78 },
  "şeker": { sugar_ratio: 1.0 },
  "pilav": { sugar_ratio: 0.01 },
  "makarna": { sugar_ratio: 0.03 },
  "ekmek": { sugar_ratio: 0.05 },
  "tavuk": { sugar_ratio: 0.0 },
  "et": { sugar_ratio: 0.0 },
  "köfte": { sugar_ratio: 0.02 },
  "yumurta": { sugar_ratio: 0.05 },
  "peynir": { sugar_ratio: 0.02 },
  "zeytin": { sugar_ratio: 0.0 },
  "patates": { sugar_ratio: 0.08 }
};

async function getSugarFromAI(ai, foodName, carbsG) {
  if (!GEMINI_API_KEY || carbsG <= 0) return 0;
  try {
    const prompt = `"${foodName}" besininin 1 birimindeki karbonhidrat miktarı ${carbsG}g dır. Bu miktar içindeki TAHMİNİ ŞEKER (sugar_g) miktarını gram olarak ver. Yanıt sadece tek bir sayı olmalı (örneğin: 12.5). Markdown, açıklama veya birim yazma.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    const text = response.text ? response.text.trim() : '';
    const num = parseFloat(text);
    return isNaN(num) ? 0 : num;
  } catch (err) {
    return 0;
  }
}

async function updateAllDatabaseFoods() {
  try {
    console.log("MongoDB'ye bağlanılıyor:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log("Bağlantı başarılı.");

    let ai = null;
    if (GEMINI_API_KEY) {
      ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    }

    // 1. FoodCache Koleksiyonunu Güncelle
    const allCacheFoods = await FoodCache.find({});
    console.log(`[FoodCache] Toplam ${allCacheFoods.length} adet besin inceleniyor...`);
    let updatedCacheCount = 0;

    for (const food of allCacheFoods) {
      const perUnit = food.per_unit || {};
      const carbs = perUnit.carbs_g || 0;
      
      // Eğer sugar_g yoksa veya null/undefined ise
      if (typeof perUnit.sugar_g !== 'number' || perUnit.sugar_g === 0) {
        if (carbs === 0) {
          food.per_unit.sugar_g = 0;
        } else {
          // İsim araması yapıp bilinen şeker oranına bakalım
          const nameLower = (food.food_name || '').toLowerCase();
          let estimatedSugar = 0;
          let matched = false;

          for (const [key, val] of Object.entries(KNOWN_SUGARS)) {
            if (nameLower.includes(key)) {
              estimatedSugar = Math.round(carbs * val.sugar_ratio * 100) / 100;
              matched = true;
              break;
            }
          }

          if (!matched && ai) {
            // Yapay zekaya sorup hassas şeker değerini alalım
            estimatedSugar = await getSugarFromAI(ai, food.food_name, carbs);
          } else if (!matched) {
            // Varsayılan oran %10
            estimatedSugar = Math.round(carbs * 0.1 * 100) / 100;
          }

          food.per_unit.sugar_g = estimatedSugar;
        }

        food.markModified('per_unit');
        await food.save();
        updatedCacheCount++;
        console.log(`✓ [FoodCache Güncellendi] ${food.food_name} (${food.unit_type}) -> Karb: ${carbs}g, Şeker: ${food.per_unit.sugar_g}g`);
      }
    }

    // 2. LocalFood Koleksiyonunu Güncelle
    const allLocalFoods = await LocalFood.find({});
    console.log(`[LocalFood] Toplam ${allLocalFoods.length} adet besin inceleniyor...`);
    let updatedLocalCount = 0;

    for (const food of allLocalFoods) {
      let isModified = false;
      if (Array.isArray(food.units)) {
        for (const u of food.units) {
          if (typeof u.sugar_g !== 'number' || u.sugar_g === 0) {
            const carbs = u.carbs_g || 0;
            if (carbs === 0) {
              u.sugar_g = 0;
            } else {
              const nameLower = (food.name || '').toLowerCase();
              let est = 0;
              let matched = false;
              for (const [key, val] of Object.entries(KNOWN_SUGARS)) {
                if (nameLower.includes(key)) {
                  est = Math.round(carbs * val.sugar_ratio * 10) / 10;
                  matched = true;
                  break;
                }
              }
              if (!matched) {
                est = Math.round(carbs * 0.15 * 10) / 10;
              }
              u.sugar_g = est;
            }
            isModified = true;
          }
        }
      }
      if (isModified) {
        food.markModified('units');
        await food.save();
        updatedLocalCount++;
        console.log(`✓ [LocalFood Güncellendi] ${food.name}`);
      }
    }

    console.log(`\n========================================`);
    console.log(`[TAMAMLANDI]`);
    console.log(`FoodCache güncellenen: ${updatedCacheCount} / ${allCacheFoods.length}`);
    console.log(`LocalFood güncellenen: ${updatedLocalCount} / ${allLocalFoods.length}`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error("GÜNCELLEME HATASI:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

updateAllDatabaseFoods();
