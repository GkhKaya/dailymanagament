const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

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

if (!MONGODB_URI) {
  console.error("HATA: MONGODB_URI .env.local dosyasında tanımlı değil!");
  process.exit(1);
}

const FoodCacheSchema = new mongoose.Schema({
  food_name: { type: String, required: true },
  food_name_en: { type: String, default: null },
  unit_type: { type: String, enum: ['gram', 'adet'], default: 'gram' },
  per_unit: {
    calories: { type: Number, required: true },
    protein_g: { type: Number, required: true },
    carbs_g: { type: Number, required: true },
    fat_g: { type: Number, required: true },
    sugar_g: { type: Number, default: 0 },
    fiber_g: { type: Number, default: null }
  },
  brand_name: { type: String, default: null },
  source: { type: String, enum: ['gemini', 'manual', 'seed'], default: 'seed' },
  search_tags: [{ type: String }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const FoodCache = mongoose.models.FoodCache || mongoose.model('FoodCache', FoodCacheSchema);

const LocalFoodSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  category: { type: String, default: 'General' },
  units: [{
    unit_name: { type: String, required: true },
    calories: { type: Number, required: true },
    protein_g: { type: Number, required: true },
    carbs_g: { type: Number, required: true },
    fat_g: { type: Number, required: true },
    sugar_g: { type: Number, default: 0 },
    fiber_g: { type: Number, default: 0 }
  }]
});

const LocalFood = mongoose.models.LocalFood || mongoose.model('LocalFood', LocalFoodSchema);

const foodsToSeed = [
  {
    food_name: "Elma",
    food_name_en: "Apple",
    unit_type: "gram",
    per_unit: { calories: 0.52, protein_g: 0.003, carbs_g: 0.138, fat_g: 0.002, sugar_g: 0.104, fiber_g: 0.024 },
    search_tags: ["elma", "apple", "meyve", "kırmızı elma", "yeşil elma"]
  },
  {
    food_name: "Elma (1 Orta Boy)",
    food_name_en: "Apple (1 Medium)",
    unit_type: "adet",
    per_unit: { calories: 78, protein_g: 0.45, carbs_g: 20.7, fat_g: 0.3, sugar_g: 15.6, fiber_g: 3.6 },
    search_tags: ["elma", "apple", "meyve", "1 adet elma", "orta boy elma"]
  },
  {
    food_name: "Muz",
    food_name_en: "Banana",
    unit_type: "gram",
    per_unit: { calories: 0.89, protein_g: 0.011, carbs_g: 0.228, fat_g: 0.003, sugar_g: 0.122, fiber_g: 0.026 },
    search_tags: ["muz", "banana", "meyve"]
  },
  {
    food_name: "Muz (1 Orta Boy)",
    food_name_en: "Banana (1 Medium)",
    unit_type: "adet",
    per_unit: { calories: 107, protein_g: 1.3, carbs_g: 27.4, fat_g: 0.4, sugar_g: 14.6, fiber_g: 3.1 },
    search_tags: ["muz", "banana", "1 adet muz", "meyve"]
  },
  {
    food_name: "Portakal",
    food_name_en: "Orange",
    unit_type: "gram",
    per_unit: { calories: 0.47, protein_g: 0.009, carbs_g: 0.118, fat_g: 0.001, sugar_g: 0.094, fiber_g: 0.024 },
    search_tags: ["portakal", "orange", "narenciye"]
  },
  {
    food_name: "Portakal (1 Orta Boy)",
    food_name_en: "Orange (1 Medium)",
    unit_type: "adet",
    per_unit: { calories: 61, protein_g: 1.2, carbs_g: 15.3, fat_g: 0.1, sugar_g: 12.2, fiber_g: 3.1 },
    search_tags: ["portakal", "orange", "1 adet portakal"]
  },
  {
    food_name: "Çilek",
    food_name_en: "Strawberry",
    unit_type: "gram",
    per_unit: { calories: 0.32, protein_g: 0.007, carbs_g: 0.077, fat_g: 0.003, sugar_g: 0.049, fiber_g: 0.02 },
    search_tags: ["çilek", "strawberry", "meyve"]
  },
  {
    food_name: "Karpuz",
    food_name_en: "Watermelon",
    unit_type: "gram",
    per_unit: { calories: 0.30, protein_g: 0.006, carbs_g: 0.076, fat_g: 0.002, sugar_g: 0.062, fiber_g: 0.004 },
    search_tags: ["karpuz", "watermelon", "meyve"]
  },
  {
    food_name: "Kuru Üzüm",
    food_name_en: "Raisins",
    unit_type: "gram",
    per_unit: { calories: 2.99, protein_g: 0.031, carbs_g: 0.792, fat_g: 0.005, sugar_g: 0.592, fiber_g: 0.037 },
    search_tags: ["kuru üzüm", "üzüm", "raisin", "kuru meyve"]
  },
  {
    food_name: "Sütlü Çikolata",
    food_name_en: "Milk Chocolate",
    unit_type: "gram",
    per_unit: { calories: 5.35, protein_g: 0.076, carbs_g: 0.594, fat_g: 0.297, sugar_g: 0.515 },
    search_tags: ["çikolata", "sütlü çikolata", "chocolate", "tatlı"]
  },
  {
    food_name: "Nutella (Kakaolu Fındık Kreması)",
    food_name_en: "Nutella",
    unit_type: "gram",
    per_unit: { calories: 5.39, protein_g: 0.063, carbs_g: 0.575, fat_g: 0.309, sugar_g: 0.563 },
    brand_name: "Nutella",
    search_tags: ["nutella", "fındık kreması", "çikolata", "kakaolu krem"]
  },
  {
    food_name: "Fıstıklı Baklava",
    food_name_en: "Baklava with Pistachio",
    unit_type: "gram",
    per_unit: { calories: 4.12, protein_g: 0.065, carbs_g: 0.48, fat_g: 0.21, sugar_g: 0.365 },
    search_tags: ["baklava", "fıstıklı baklava", "tatlı", "şerbetli"]
  },
  {
    food_name: "Fıstıklı Baklava (1 Dilim)",
    food_name_en: "Baklava (1 Piece)",
    unit_type: "adet",
    per_unit: { calories: 165, protein_g: 2.6, carbs_g: 19.2, fat_g: 8.4, sugar_g: 14.6 },
    search_tags: ["baklava", "1 dilim baklava", "tatlı"]
  },
  {
    food_name: "Coca Cola / Kola",
    food_name_en: "Coca Cola",
    unit_type: "gram",
    per_unit: { calories: 0.42, protein_g: 0, carbs_g: 0.106, fat_g: 0, sugar_g: 0.106 },
    brand_name: "Coca Cola",
    search_tags: ["kola", "coca cola", "gazlı içecek", "cola"]
  },
  {
    food_name: "Coca Cola / Kola (1 Kutu 330ml)",
    food_name_en: "Coca Cola Can",
    unit_type: "adet",
    per_unit: { calories: 139, protein_g: 0, carbs_g: 35.0, fat_g: 0, sugar_g: 35.0 },
    brand_name: "Coca Cola",
    search_tags: ["kutu kola", "kola 330ml", "coca cola"]
  },
  {
    food_name: "Meyveli Yoğurt (Çilekli)",
    food_name_en: "Strawberry Yogurt",
    unit_type: "gram",
    per_unit: { calories: 0.95, protein_g: 0.035, carbs_g: 0.14, fat_g: 0.025, sugar_g: 0.13 },
    search_tags: ["yoğurt", "meyveli yoğurt", "çilekli yoğurt"]
  },
  {
    food_name: "Bal (Çiçek Balı)",
    food_name_en: "Honey",
    unit_type: "gram",
    per_unit: { calories: 3.04, protein_g: 0.003, carbs_g: 0.824, fat_g: 0, sugar_g: 0.821 },
    search_tags: ["bal", "honey", "çiçek balı", "süzme bal"]
  },
  {
    food_name: "Bal (1 Yemek Kaşığı)",
    food_name_en: "Honey (1 Tbsp)",
    unit_type: "adet",
    per_unit: { calories: 64, protein_g: 0.1, carbs_g: 17.3, fat_g: 0, sugar_g: 17.2 },
    search_tags: ["bal", "1 kaşık bal", "yemek kaşığı bal"]
  },
  {
    food_name: "Çilek Reçeli",
    food_name_en: "Strawberry Jam",
    unit_type: "gram",
    per_unit: { calories: 2.78, protein_g: 0.004, carbs_g: 0.69, fat_g: 0.001, sugar_g: 0.60 },
    search_tags: ["reçel", "çilek reçeli", "jam"]
  },
  {
    food_name: "Negro / Bisküvi",
    food_name_en: "Cocoa Cookie",
    unit_type: "gram",
    per_unit: { calories: 4.80, protein_g: 0.055, carbs_g: 0.67, fat_g: 0.21, sugar_g: 0.38 },
    search_tags: ["bisküvi", "negro", "oreo", "kakaolu bisküvi"]
  },
  {
    food_name: "Negro / Bisküvi (1 Adet)",
    food_name_en: "Cocoa Cookie (1 Piece)",
    unit_type: "adet",
    per_unit: { calories: 53, protein_g: 0.6, carbs_g: 7.4, fat_g: 2.3, sugar_g: 4.2 },
    search_tags: ["1 adet bisküvi", "negro", "oreo"]
  },
  {
    food_name: "Süt (Tam Yağlı)",
    food_name_en: "Whole Milk",
    unit_type: "gram",
    per_unit: { calories: 0.61, protein_g: 0.032, carbs_g: 0.048, fat_g: 0.033, sugar_g: 0.048 },
    search_tags: ["süt", "milk", "tam yağlı süt"]
  },
  {
    food_name: "Süt (1 Su Bardağı 200ml)",
    food_name_en: "Glass of Milk",
    unit_type: "adet",
    per_unit: { calories: 122, protein_g: 6.4, carbs_g: 9.6, fat_g: 6.6, sugar_g: 9.6 },
    search_tags: ["1 bardak süt", "su bardağı süt", "süt"]
  },
  {
    food_name: "Maraş Dondurması",
    food_name_en: "Ice Cream",
    unit_type: "gram",
    per_unit: { calories: 2.07, protein_g: 0.035, carbs_g: 0.24, fat_g: 0.11, sugar_g: 0.21 },
    search_tags: ["dondurma", "maraş dondurması", "ice cream"]
  },
  {
    food_name: "Medine Hurması",
    food_name_en: "Dates",
    unit_type: "gram",
    per_unit: { calories: 2.77, protein_g: 0.018, carbs_g: 0.75, fat_g: 0.002, sugar_g: 0.665 },
    search_tags: ["hurma", "medine hurması", "dates", "kuru meyve"]
  },
  {
    food_name: "Medine Hurması (1 Adet)",
    food_name_en: "Date (1 Piece)",
    unit_type: "adet",
    per_unit: { calories: 42, protein_g: 0.3, carbs_g: 11.3, fat_g: 0, sugar_g: 10.0 },
    search_tags: ["1 adet hurma", "hurma"]
  },
  {
    food_name: "Tahin Helvası",
    food_name_en: "Tahini Halva",
    unit_type: "gram",
    per_unit: { calories: 5.16, protein_g: 0.12, carbs_g: 0.54, fat_g: 0.28, sugar_g: 0.42 },
    search_tags: ["helva", "tahin helvası", "sade helva"]
  },
  {
    food_name: "Toz Şeker",
    food_name_en: "Granulated Sugar",
    unit_type: "gram",
    per_unit: { calories: 3.87, protein_g: 0, carbs_g: 1.0, fat_g: 0, sugar_g: 1.0 },
    search_tags: ["şeker", "toz şeker", "sugar"]
  },
  {
    food_name: "Kesme Şeker (1 Adet)",
    food_name_en: "Sugar Cube",
    unit_type: "adet",
    per_unit: { calories: 16, protein_g: 0, carbs_g: 4.0, fat_g: 0, sugar_g: 4.0 },
    search_tags: ["kesme şeker", "1 adet kesme şeker", "şeker"]
  }
];

async function runSeed() {
  try {
    console.log("MongoDB'ye bağlanılıyor:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB bağlantısı başarılı.");

    let count = 0;
    for (const food of foodsToSeed) {
      // Önce var olan eski kayıtları silelim
      await FoodCache.deleteMany({ food_name: food.food_name });

      await FoodCache.create({
        food_name: food.food_name,
        food_name_en: food.food_name_en || null,
        unit_type: food.unit_type,
        per_unit: food.per_unit,
        brand_name: food.brand_name || null,
        source: 'manual',
        search_tags: food.search_tags
      });

      // Ayrıca LocalFood koleksiyonuna da kaydedelim
      await LocalFood.updateOne(
        { name: food.food_name },
        {
          $set: {
            name: food.food_name,
            category: 'General',
            units: [{
              unit_name: food.unit_type === 'gram' ? '100g' : '1 adet',
              calories: food.unit_type === 'gram' ? Math.round(food.per_unit.calories * 100) : food.per_unit.calories,
              protein_g: food.unit_type === 'gram' ? Math.round(food.per_unit.protein_g * 100 * 10) / 10 : food.per_unit.protein_g,
              carbs_g: food.unit_type === 'gram' ? Math.round(food.per_unit.carbs_g * 100 * 10) / 10 : food.per_unit.carbs_g,
              fat_g: food.unit_type === 'gram' ? Math.round(food.per_unit.fat_g * 100 * 10) / 10 : food.per_unit.fat_g,
              sugar_g: food.unit_type === 'gram' ? Math.round((food.per_unit.sugar_g || 0) * 100 * 10) / 10 : food.per_unit.sugar_g,
              fiber_g: food.unit_type === 'gram' ? Math.round((food.per_unit.fiber_g || 0) * 100 * 10) / 10 : food.per_unit.fiber_g
            }]
          }
        },
        { upsert: true }
      );
      count++;
    }

    console.log(`[BAŞARILI] Toplam ${count} adet besin veritabanına şeker değerleriyle aktarıldı/güncellendi!`);
  } catch (err) {
    console.error("Seed hatası:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runSeed();
