/**
 * FoodCache Seed Script
 * 50 yaygın Türk yemeği (çiğ/ham) + markalı ürünler
 * 
 * Çalıştırmak için: node scripts/seed-food-cache.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

// Node.js IPv6 dual-stack DNS gecikmesini önlemek için IPv4 önceliklendir
dns.setDefaultResultOrder('ipv4first');

// .env.local'ı manuel parse et (dotenv paketi olmadan)
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Tırnak işaretlerini kaldır
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;

const FoodCacheSchema = new mongoose.Schema({
  food_name: { type: String, required: true },
  food_name_en: { type: String, default: null },
  unit_type: { type: String, enum: ['gram', 'adet'], default: 'gram' },
  per_unit: {
    calories: { type: Number, required: true },
    protein_g: { type: Number, required: true },
    carbs_g: { type: Number, required: true },
    fat_g: { type: Number, required: true },
    fiber_g: { type: Number, default: null }
  },
  brand_name: { type: String, default: null },
  source: { type: String, enum: ['gemini', 'manual', 'seed'], default: 'seed' },
  search_tags: [{ type: String }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

FoodCacheSchema.index({ food_name: 'text', food_name_en: 'text', search_tags: 'text' });
FoodCacheSchema.index({ food_name: 1, brand_name: 1 }, { unique: true });

// ─── SEED DATA ─────────────────────────────────────────────────────────────

/**
 * per_unit: 1 GRAM veya 1 ADET için değerler
 * Tüm gram bazlı yemekler çiğ/ham değerleri içerir
 */
const SEED_FOODS = [
  // ── TAHILLAR & BAKLIYATLAR ──
  {
    food_name: "Bulgur",
    food_name_en: "Bulgur Wheat",
    unit_type: "gram",
    per_unit: { calories: 3.43, protein_g: 0.121, carbs_g: 0.688, fat_g: 0.013, fiber_g: 0.182 },
    source: "seed",
    search_tags: ["bulgur", "tahıl", "pirinç", "bulgur pilavı"]
  },
  {
    food_name: "Basmati Pirinç",
    food_name_en: "Basmati Rice",
    unit_type: "gram",
    per_unit: { calories: 3.49, protein_g: 0.073, carbs_g: 0.770, fat_g: 0.004, fiber_g: 0.012 },
    source: "seed",
    search_tags: ["basmati", "pirinç", "pirinç pilavı", "rice"]
  },
  {
    food_name: "Yulaf",
    food_name_en: "Oats",
    unit_type: "gram",
    per_unit: { calories: 3.89, protein_g: 0.170, carbs_g: 0.662, fat_g: 0.070, fiber_g: 0.105 },
    source: "seed",
    search_tags: ["yulaf", "yulaf ezmesi", "oat", "oatmeal", "ezmesi"]
  },
  {
    food_name: "Makarna",
    food_name_en: "Pasta",
    unit_type: "gram",
    per_unit: { calories: 3.71, protein_g: 0.130, carbs_g: 0.750, fat_g: 0.015, fiber_g: 0.028 },
    source: "seed",
    search_tags: ["makarna", "erişte", "spagetti", "penne", "pasta"]
  },
  {
    food_name: "Ekmek (Beyaz)",
    food_name_en: "White Bread",
    unit_type: "gram",
    per_unit: { calories: 2.65, protein_g: 0.090, carbs_g: 0.490, fat_g: 0.032, fiber_g: 0.027 },
    source: "seed",
    search_tags: ["ekmek", "beyaz ekmek", "bread", "francala"]
  },
  {
    food_name: "Tam Buğday Ekmeği",
    food_name_en: "Whole Wheat Bread",
    unit_type: "gram",
    per_unit: { calories: 2.47, protein_g: 0.110, carbs_g: 0.414, fat_g: 0.034, fiber_g: 0.069 },
    source: "seed",
    search_tags: ["tam buğday", "kepekli ekmek", "whole wheat", "kepekli"]
  },
  {
    food_name: "Simit",
    food_name_en: "Simit (Turkish Sesame Bread Ring)",
    unit_type: "adet",
    per_unit: { calories: 280, protein_g: 8.5, carbs_g: 54.0, fat_g: 4.5, fiber_g: 2.1 },
    source: "seed",
    search_tags: ["simit", "açık simit", "kapalı simit"]
  },
  {
    food_name: "Mercimek (Kırmızı)",
    food_name_en: "Red Lentils",
    unit_type: "gram",
    per_unit: { calories: 3.52, protein_g: 0.238, carbs_g: 0.602, fat_g: 0.011, fiber_g: 0.108 },
    source: "seed",
    search_tags: ["mercimek", "kırmızı mercimek", "lentil", "red lentil"]
  },
  {
    food_name: "Nohut",
    food_name_en: "Chickpeas",
    unit_type: "gram",
    per_unit: { calories: 3.64, protein_g: 0.190, carbs_g: 0.607, fat_g: 0.060, fiber_g: 0.170 },
    source: "seed",
    search_tags: ["nohut", "chickpeas", "garbanzo"]
  },
  {
    food_name: "Fasulye (Kuru Beyaz)",
    food_name_en: "White Beans",
    unit_type: "gram",
    per_unit: { calories: 3.37, protein_g: 0.238, carbs_g: 0.602, fat_g: 0.008, fiber_g: 0.155 },
    source: "seed",
    search_tags: ["fasulye", "kuru fasulye", "white bean", "beans"]
  },

  // ── ETLİ ÜRÜNLER ──
  {
    food_name: "Tavuk Göğsü (Çiğ)",
    food_name_en: "Chicken Breast (Raw)",
    unit_type: "gram",
    per_unit: { calories: 1.20, protein_g: 0.230, carbs_g: 0.000, fat_g: 0.026, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["tavuk", "tavuk göğsü", "chicken breast", "chicken", "beyaz et"]
  },
  {
    food_name: "Kıyma (Dana Orta Yağlı)",
    food_name_en: "Ground Beef (Medium Fat)",
    unit_type: "gram",
    per_unit: { calories: 2.17, protein_g: 0.175, carbs_g: 0.000, fat_g: 0.150, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["kıyma", "dana kıyma", "ground beef", "minced beef", "hamburger", "kıymalı"]
  },
  {
    food_name: "Kıyma (Kuzu)",
    food_name_en: "Ground Lamb",
    unit_type: "gram",
    per_unit: { calories: 2.82, protein_g: 0.170, carbs_g: 0.000, fat_g: 0.200, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["kıyma", "kuzu kıyma", "ground lamb", "lamb"]
  },
  {
    food_name: "Dana Bonfile",
    food_name_en: "Beef Tenderloin",
    unit_type: "gram",
    per_unit: { calories: 1.44, protein_g: 0.220, carbs_g: 0.000, fat_g: 0.061, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["bonfile", "dana bonfile", "biftek", "beef", "tenderloin"]
  },
  {
    food_name: "Somon (Çiğ)",
    food_name_en: "Salmon (Raw)",
    unit_type: "gram",
    per_unit: { calories: 2.08, protein_g: 0.200, carbs_g: 0.000, fat_g: 0.130, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["somon", "salmon", "balık", "fish"]
  },
  {
    food_name: "Ton Balığı (Su İçinde)",
    food_name_en: "Tuna (Canned in Water)",
    unit_type: "gram",
    per_unit: { calories: 1.16, protein_g: 0.259, carbs_g: 0.000, fat_g: 0.010, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["ton balığı", "tuna", "tuna balığı", "konserve"]
  },
  {
    food_name: "Hindi Göğsü (Çiğ)",
    food_name_en: "Turkey Breast (Raw)",
    unit_type: "gram",
    per_unit: { calories: 1.05, protein_g: 0.230, carbs_g: 0.000, fat_g: 0.010, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["hindi", "hindi göğsü", "turkey breast", "turkey"]
  },

  // ── SÜT ÜRÜNLERİ & YUMURTA ──
  {
    food_name: "Süt (Tam Yağlı)",
    food_name_en: "Whole Milk",
    unit_type: "gram",
    per_unit: { calories: 0.61, protein_g: 0.032, carbs_g: 0.047, fat_g: 0.033, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["süt", "tam yağlı süt", "whole milk", "milk", "içme sütü"]
  },
  {
    food_name: "Süt (Yarım Yağlı)",
    food_name_en: "Semi-Skimmed Milk",
    unit_type: "gram",
    per_unit: { calories: 0.46, protein_g: 0.032, carbs_g: 0.047, fat_g: 0.015, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["süt", "yarım yağlı", "semi skimmed", "light milk"]
  },
  {
    food_name: "Yoğurt (Tam Yağlı)",
    food_name_en: "Full Fat Yogurt",
    unit_type: "gram",
    per_unit: { calories: 0.97, protein_g: 0.045, carbs_g: 0.038, fat_g: 0.060, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["yoğurt", "yogurt", "plain yogurt", "thick yogurt"]
  },
  {
    food_name: "Süzme Yoğurt",
    food_name_en: "Greek Yogurt",
    unit_type: "gram",
    per_unit: { calories: 0.59, protein_g: 0.100, carbs_g: 0.036, fat_g: 0.000, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["süzme yoğurt", "greek yogurt", "protein yogurt", "yağsız yoğurt"]
  },
  {
    food_name: "Yumurta",
    food_name_en: "Egg",
    unit_type: "adet",
    per_unit: { calories: 72, protein_g: 6.3, carbs_g: 0.4, fat_g: 4.8, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["yumurta", "egg", "tavuk yumurtası"]
  },
  {
    food_name: "Beyaz Peynir (Tam Yağlı)",
    food_name_en: "Turkish White Cheese (Feta-Style)",
    unit_type: "gram",
    per_unit: { calories: 2.64, protein_g: 0.140, carbs_g: 0.030, fat_g: 0.210, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["beyaz peynir", "peynir", "feta", "white cheese", "cheese"]
  },
  {
    food_name: "Kaşar Peyniri",
    food_name_en: "Kashar Cheese",
    unit_type: "gram",
    per_unit: { calories: 3.56, protein_g: 0.250, carbs_g: 0.020, fat_g: 0.270, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["kaşar", "kaşar peyniri", "kashar cheese", "sarı peynir"]
  },
  {
    food_name: "Tereyağı",
    food_name_en: "Butter",
    unit_type: "gram",
    per_unit: { calories: 7.17, protein_g: 0.005, carbs_g: 0.001, fat_g: 0.810, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["tereyağı", "butter", "yağ", "tereyağ"]
  },
  {
    food_name: "Lor Peyniri",
    food_name_en: "Cottage Cheese",
    unit_type: "gram",
    per_unit: { calories: 0.98, protein_g: 0.113, carbs_g: 0.033, fat_g: 0.043, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["lor", "lor peyniri", "cottage cheese", "ricotta"]
  },

  // ── SEBZELER ──
  {
    food_name: "Domates",
    food_name_en: "Tomato",
    unit_type: "gram",
    per_unit: { calories: 0.18, protein_g: 0.009, carbs_g: 0.039, fat_g: 0.002, fiber_g: 0.012 },
    source: "seed",
    search_tags: ["domates", "tomato", "salçalık domates"]
  },
  {
    food_name: "Salatalık",
    food_name_en: "Cucumber",
    unit_type: "gram",
    per_unit: { calories: 0.15, protein_g: 0.006, carbs_g: 0.036, fat_g: 0.001, fiber_g: 0.005 },
    source: "seed",
    search_tags: ["salatalık", "cucumber", "hıyar"]
  },
  {
    food_name: "Ispanak",
    food_name_en: "Spinach",
    unit_type: "gram",
    per_unit: { calories: 0.23, protein_g: 0.029, carbs_g: 0.036, fat_g: 0.004, fiber_g: 0.022 },
    source: "seed",
    search_tags: ["ıspanak", "ispanak", "spinach"]
  },
  {
    food_name: "Brokoli",
    food_name_en: "Broccoli",
    unit_type: "gram",
    per_unit: { calories: 0.34, protein_g: 0.028, carbs_g: 0.066, fat_g: 0.004, fiber_g: 0.026 },
    source: "seed",
    search_tags: ["brokoli", "broccoli"]
  },
  {
    food_name: "Soğan",
    food_name_en: "Onion",
    unit_type: "gram",
    per_unit: { calories: 0.40, protein_g: 0.011, carbs_g: 0.093, fat_g: 0.001, fiber_g: 0.017 },
    source: "seed",
    search_tags: ["soğan", "kuru soğan", "onion"]
  },
  {
    food_name: "Patates",
    food_name_en: "Potato",
    unit_type: "gram",
    per_unit: { calories: 0.77, protein_g: 0.020, carbs_g: 0.175, fat_g: 0.001, fiber_g: 0.022 },
    source: "seed",
    search_tags: ["patates", "potato", "taze patates"]
  },

  // ── MEYVELER ──
  {
    food_name: "Muz",
    food_name_en: "Banana",
    unit_type: "adet",
    per_unit: { calories: 89, protein_g: 1.1, carbs_g: 23.0, fat_g: 0.3, fiber_g: 2.6 },
    source: "seed",
    search_tags: ["muz", "banana"]
  },
  {
    food_name: "Elma",
    food_name_en: "Apple",
    unit_type: "adet",
    per_unit: { calories: 81, protein_g: 0.4, carbs_g: 21.0, fat_g: 0.3, fiber_g: 3.7 },
    source: "seed",
    search_tags: ["elma", "apple"]
  },
  {
    food_name: "Portakal",
    food_name_en: "Orange",
    unit_type: "adet",
    per_unit: { calories: 62, protein_g: 1.2, carbs_g: 15.4, fat_g: 0.2, fiber_g: 3.1 },
    source: "seed",
    search_tags: ["portakal", "orange", "mandalina"]
  },

  // ── YAĞLAR & TAHILLAR ──
  {
    food_name: "Zeytinyağı",
    food_name_en: "Olive Oil",
    unit_type: "gram",
    per_unit: { calories: 8.84, protein_g: 0.0, carbs_g: 0.0, fat_g: 1.0, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["zeytinyağı", "olive oil", "yağ", "sıvı yağ"]
  },
  {
    food_name: "Ayçiçek Yağı",
    food_name_en: "Sunflower Oil",
    unit_type: "gram",
    per_unit: { calories: 8.84, protein_g: 0.0, carbs_g: 0.0, fat_g: 1.0, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["ayçiçek yağı", "ayçiçeği yağı", "sunflower oil", "sıvı yağ"]
  },
  {
    food_name: "Zeytin (Siyah)",
    food_name_en: "Black Olive",
    unit_type: "adet",
    per_unit: { calories: 7, protein_g: 0.05, carbs_g: 0.4, fat_g: 0.7, fiber_g: 0.2 },
    source: "seed",
    search_tags: ["zeytin", "siyah zeytin", "black olive", "olive"]
  },
  {
    food_name: "Fındık",
    food_name_en: "Hazelnuts",
    unit_type: "gram",
    per_unit: { calories: 6.28, protein_g: 0.150, carbs_g: 0.168, fat_g: 0.609, fiber_g: 0.097 },
    source: "seed",
    search_tags: ["fındık", "hazelnut", "kuruyemiş", "fındık içi"]
  },
  {
    food_name: "Badem",
    food_name_en: "Almonds",
    unit_type: "gram",
    per_unit: { calories: 5.78, protein_g: 0.214, carbs_g: 0.215, fat_g: 0.499, fiber_g: 0.125 },
    source: "seed",
    search_tags: ["badem", "almond", "kuruyemiş"]
  },

  // ── PROTEİN TOZU & TAKVİYELER ──
  {
    food_name: "Whey Protein (Vanilyalı)",
    food_name_en: "Whey Protein Vanilla",
    unit_type: "gram",
    per_unit: { calories: 3.73, protein_g: 0.790, carbs_g: 0.060, fat_g: 0.030, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["whey", "protein tozu", "protein powder", "whey protein"]
  },

  // ── ATISTIRMALIKLAR ──
  {
    food_name: "Çikolata (Bitter %70)",
    food_name_en: "Dark Chocolate 70%",
    unit_type: "gram",
    per_unit: { calories: 5.98, protein_g: 0.078, carbs_g: 0.457, fat_g: 0.428, fiber_g: 0.107 },
    source: "seed",
    search_tags: ["çikolata", "bitter çikolata", "dark chocolate", "chocolate"]
  },

  // ── MARKALIK ÜRÜNLER ──
  {
    food_name: "Mis Yağsız Süt",
    food_name_en: "Mis Skimmed Milk",
    unit_type: "gram",
    per_unit: { calories: 0.33, protein_g: 0.034, carbs_g: 0.048, fat_g: 0.001, fiber_g: 0.0 },
    brand_name: "Mis",
    source: "seed",
    search_tags: ["mis süt", "yağsız süt", "mis yağsız", "skim milk", "mis"]
  },
  {
    food_name: "Mis Tam Yağlı Süt",
    food_name_en: "Mis Whole Milk",
    unit_type: "gram",
    per_unit: { calories: 0.63, protein_g: 0.030, carbs_g: 0.047, fat_g: 0.035, fiber_g: 0.0 },
    brand_name: "Mis",
    source: "seed",
    search_tags: ["mis süt", "mis tam yağlı", "mis whole milk", "mis"]
  },
  {
    food_name: "Algida Classic Dondurma",
    food_name_en: "Algida Classic Ice Cream",
    unit_type: "adet",
    per_unit: { calories: 180, protein_g: 2.5, carbs_g: 24.0, fat_g: 8.0, fiber_g: 0.0 },
    brand_name: "Algida",
    source: "seed",
    search_tags: ["algida", "algida classic", "dondurma", "ice cream", "classic"]
  },
  {
    food_name: "Algida Vienetta Dondurma",
    food_name_en: "Algida Vienetta Ice Cream",
    unit_type: "gram",
    per_unit: { calories: 2.30, protein_g: 0.025, carbs_g: 0.260, fat_g: 0.120, fiber_g: 0.0 },
    brand_name: "Algida",
    source: "seed",
    search_tags: ["algida", "vienetta", "vinietta", "dondurma", "ice cream"]
  },
  {
    food_name: "Gong Çikolata",
    food_name_en: "Gong Chocolate Bar",
    unit_type: "adet",
    per_unit: { calories: 270, protein_g: 3.5, carbs_g: 36.0, fat_g: 12.0, fiber_g: 1.0 },
    brand_name: "Ülker",
    source: "seed",
    search_tags: ["gong", "gong çikolata", "ülker gong", "çikolatalı bar", "chocolate bar"]
  },
  // Ek yaygın yemekler
  {
    food_name: "Pirinç (Beyaz, Uzun Taneli)",
    food_name_en: "White Rice (Long Grain)",
    unit_type: "gram",
    per_unit: { calories: 3.65, protein_g: 0.075, carbs_g: 0.795, fat_g: 0.006, fiber_g: 0.012 },
    source: "seed",
    search_tags: ["pirinç", "beyaz pirinç", "white rice", "rice", "pirinç pilavı"]
  },
  {
    food_name: "Kepekli Yulaf Ezmesi",
    food_name_en: "Rolled Oats",
    unit_type: "gram",
    per_unit: { calories: 3.71, protein_g: 0.132, carbs_g: 0.674, fat_g: 0.064, fiber_g: 0.103 },
    source: "seed",
    search_tags: ["yulaf", "yulaf ezmesi", "rolled oats", "oatmeal", "müsli"]
  },
  {
    food_name: "Zeytinyağlı Konserve Ton Balığı",
    food_name_en: "Tuna in Olive Oil",
    unit_type: "gram",
    per_unit: { calories: 2.00, protein_g: 0.243, carbs_g: 0.000, fat_g: 0.100, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["ton balığı", "tuna", "zeytinyağlı ton", "konserve ton", "tuna olive oil"]
  },
  {
    food_name: "McDonald's Patates Kızartması (Orta Boy)",
    food_name_en: "McDonald's French Fries (Medium)",
    unit_type: "adet",
    per_unit: { calories: 277, protein_g: 3.0, carbs_g: 35.3, fat_g: 14.5, fiber_g: 3.4 },
    brand_name: "McDonald's",
    source: "seed",
    search_tags: ["mcdonalds", "mc donalds", "patates", "patates kızartması", "french fries", "fries", "orta boy patates"]
  },
  {
    food_name: "Ruffles Ketçaplı",
    food_name_en: "Ruffles Ketchup Flavored Chips",
    unit_type: "gram",
    per_unit: { calories: 5.35, protein_g: 0.059, carbs_g: 0.520, fat_g: 0.330, fiber_g: 0.040 },
    brand_name: "Ruffles",
    source: "seed",
    search_tags: ["ruffles", "ruffles ketçaplı", "ketçaplı cips", "cips", "chips", "ketchup chips"]
  },
  {
    food_name: "Leblebi (Sarı Leblebi)",
    food_name_en: "Roasted Yellow Chickpeas",
    unit_type: "gram",
    per_unit: { calories: 3.68, protein_g: 0.198, carbs_g: 0.580, fat_g: 0.052, fiber_g: 0.120 },
    source: "seed",
    search_tags: ["leblebi", "sarı leblebi", "kavrulmuş leblebi", "chickpeas", "roasted chickpeas", "kuruyemiş"]
  },
  {
    food_name: "Bitkisel Yağlı Krem Sos",
    food_name_en: "Vegetable Cream Sauce",
    unit_type: "gram",
    per_unit: { calories: 1.95, protein_g: 0.022, carbs_g: 0.040, fat_g: 0.185, fiber_g: 0.0 },
    source: "seed",
    search_tags: ["krem sos", "krema sos", "bitkisel krema", "yemeklik krema", "sıvı krema", "krema", "cream sauce", "cooking cream"]
  }
];

// ─── MAIN ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 FoodCache seed işlemi başlıyor...');
  console.log(`📊 Toplam ${SEED_FOODS.length} yemek eklenecek`);

  await mongoose.connect(MONGODB_URI);
  console.log('✅ MongoDB bağlantısı kuruldu');

  const FoodCacheModel = mongoose.models.FoodCache || mongoose.model('FoodCache', FoodCacheSchema);

  let added = 0;
  let skipped = 0;
  let errors = 0;

  for (const food of SEED_FOODS) {
    try {
      const result = await FoodCacheModel.updateOne(
        { food_name: food.food_name, brand_name: food.brand_name || null },
        { $setOnInsert: food },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        console.log(`  ✅ Eklendi: ${food.food_name}${food.brand_name ? ` (${food.brand_name})` : ''}`);
        added++;
      } else {
        console.log(`  ⏭  Zaten var: ${food.food_name}${food.brand_name ? ` (${food.brand_name})` : ''}`);
        skipped++;
      }
    } catch (err) {
      console.error(`  ❌ Hata (${food.food_name}):`, err.message);
      errors++;
    }
  }

  console.log('\n─────────────────────────────────');
  console.log(`✅ Eklenen: ${added}`);
  console.log(`⏭  Zaten var (atlandı): ${skipped}`);
  console.log(`❌ Hata: ${errors}`);
  console.log('─────────────────────────────────');
  console.log('🎉 Seed işlemi tamamlandı!');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Seed hatası:', err);
  process.exit(1);
});
