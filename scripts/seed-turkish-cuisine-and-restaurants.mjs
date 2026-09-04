/**
 * TÜRKOMP + Geleneksel Türk Mutfağı & Popüler Restoran Menüleri Master Seed Scripti
 * 
 * Özellikler:
 * - Mevcut veritabanındaki hiçbir ürünü ezmez (varsa atlar).
 * - FatSecret standardında ev tipi porsiyonlar (1 kase, 1 su bardağı, 1 yemek kaşığı, 1 dilim, vb.) ekler.
 * - Çorbalar, ev yemekleri, kebaplar, kahvaltılıklar ve Köfteci Yusuf, Starbucks, McDonald's, 
 *   Tavuk Dünyası, Domino's gibi popüler restoran menülerini kapsar.
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

// Helper for per 1g macros from 100g values
function per100g(cal, pro, carb, fat, sugar = 0, fiber = 0) {
  return {
    calories: Math.round((cal / 100) * 1000) / 1000,
    protein_g: Math.round((pro / 100) * 1000) / 1000,
    carbs_g: Math.round((carb / 100) * 1000) / 1000,
    fat_g: Math.round((fat / 100) * 1000) / 1000,
    sugar_g: Math.round((sugar / 100) * 1000) / 1000,
    fiber_g: Math.round((fiber / 100) * 1000) / 1000
  };
}

// Master list of traditional Turkish dishes & restaurant menu items
const MASTER_FOODS = [
  // ─── 1. ÇORBALAR ───
  {
    food_name: 'Mercimek Çorbası',
    food_name_en: 'Lentil Soup',
    unit_type: 'gram',
    per_unit: per100g(56, 3.2, 8.5, 1.1, 0.6, 1.8),
    portions: [
      { name: '1 Kase (250g)', gram_weight: 250, label: '250 ml' },
      { name: '1 Porsiyon (300g)', gram_weight: 300, label: '300 ml' },
      { name: '1 Kepçe (150g)', gram_weight: 150, label: '150 ml' }
    ],
    source: 'turkomp',
    search_tags: ['çorba', 'mercimek', 'kırmızı mercimek', 'başlangıç']
  },
  {
    food_name: 'Ezogelin Çorbası',
    food_name_en: 'Ezogelin Soup',
    unit_type: 'gram',
    per_unit: per100g(64, 2.8, 9.6, 1.6, 0.8, 1.5),
    portions: [
      { name: '1 Kase (250g)', gram_weight: 250, label: '250 ml' },
      { name: '1 Porsiyon (300g)', gram_weight: 300, label: '300 ml' },
      { name: '1 Kepçe (150g)', gram_weight: 150, label: '150 ml' }
    ],
    source: 'turkomp',
    search_tags: ['çorba', 'ezogelin', 'bulgur', 'mercimek']
  },
  {
    food_name: 'Yayla Çorbası',
    food_name_en: 'Yogurt Rice Soup (Yayla)',
    unit_type: 'gram',
    per_unit: per100g(48, 2.1, 6.4, 1.5, 1.2, 0.4),
    portions: [
      { name: '1 Kase (250g)', gram_weight: 250 },
      { name: '1 Porsiyon (300g)', gram_weight: 300 }
    ],
    source: 'turkomp',
    search_tags: ['çorba', 'yayla', 'yoğurt', 'pirinç']
  },
  {
    food_name: 'Tarhana Çorbası',
    food_name_en: 'Tarhana Soup',
    unit_type: 'gram',
    per_unit: per100g(60, 2.5, 9.8, 1.2, 1.5, 0.8),
    portions: [
      { name: '1 Kase (250g)', gram_weight: 250 },
      { name: '1 Porsiyon (300g)', gram_weight: 300 }
    ],
    source: 'turkomp',
    search_tags: ['çorba', 'tarhana', 'ev yapımı']
  },
  {
    food_name: 'Kelle Paça Çorbası',
    food_name_en: 'Sheep Head and Trotter Soup',
    unit_type: 'gram',
    per_unit: per100g(135, 11.2, 1.5, 9.4, 0.2, 0),
    portions: [
      { name: '1 Kase (250g)', gram_weight: 250 },
      { name: '1 Porsiyon (300g)', gram_weight: 300 }
    ],
    source: 'turkomp',
    search_tags: ['çorba', 'kelle paça', 'sakatat', 'paça']
  },
  {
    food_name: 'İşkembe Çorbası',
    food_name_en: 'Tripe Soup',
    unit_type: 'gram',
    per_unit: per100g(112, 8.6, 2.8, 7.5, 0.4, 0),
    portions: [
      { name: '1 Kase (250g)', gram_weight: 250 },
      { name: '1 Porsiyon (300g)', gram_weight: 300 }
    ],
    source: 'turkomp',
    search_tags: ['çorba', 'işkembe', 'sakatat', 'çorbacı']
  },
  {
    food_name: 'Tavuk Suyu Çorbası',
    food_name_en: 'Chicken Broth Soup with Vermicelli',
    unit_type: 'gram',
    per_unit: per100g(52, 4.2, 5.1, 1.6, 0.3, 0.4),
    portions: [
      { name: '1 Kase (250g)', gram_weight: 250 },
      { name: '1 Porsiyon (300g)', gram_weight: 300 }
    ],
    source: 'turkomp',
    search_tags: ['çorba', 'tavuk suyu', 'şehriye']
  },
  {
    food_name: 'Domates Çorbası (Kaşarlı)',
    food_name_en: 'Tomato Soup with Melted Cheese',
    unit_type: 'gram',
    per_unit: per100g(68, 2.6, 7.8, 3.1, 2.5, 0.9),
    portions: [
      { name: '1 Kase (250g)', gram_weight: 250 },
      { name: '1 Porsiyon (300g)', gram_weight: 300 }
    ],
    source: 'turkomp',
    search_tags: ['çorba', 'domates', 'kaşarlı domates']
  },

  // ─── 2. EV & TENCERE YEMEKLERİ ───
  {
    food_name: 'Kuru Fasulye (Etsiz)',
    food_name_en: 'White Bean Stew (Vegetarian)',
    unit_type: 'gram',
    per_unit: per100g(118, 6.8, 18.2, 2.1, 1.4, 5.2),
    portions: [
      { name: '1 Porsiyon (250g)', gram_weight: 250 },
      { name: '1 Tabak (200g)', gram_weight: 200 },
      { name: '1 Yemek Kaşığı (25g)', gram_weight: 25 }
    ],
    source: 'turkomp',
    search_tags: ['kuru fasulye', 'bakliyat', 'tencere yemeği']
  },
  {
    food_name: 'Kuru Fasulye (Etli)',
    food_name_en: 'White Bean Stew with Beef',
    unit_type: 'gram',
    per_unit: per100g(142, 9.4, 16.5, 4.5, 1.2, 4.8),
    portions: [
      { name: '1 Porsiyon (250g)', gram_weight: 250 },
      { name: '1 Tabak (200g)', gram_weight: 200 },
      { name: '1 Yemek Kaşığı (25g)', gram_weight: 25 }
    ],
    source: 'turkomp',
    search_tags: ['kuru fasulye', 'etli kuru fasulye', 'bakliyat']
  },
  {
    food_name: 'Karnıyarık',
    food_name_en: 'Stuffed Eggplant with Minced Meat (Karniyarik)',
    unit_type: 'gram',
    per_unit: per100g(115, 5.8, 6.2, 7.8, 2.4, 2.6),
    portions: [
      { name: '1 Adet Orta Boy (180g)', gram_weight: 180 },
      { name: '1 Porsiyon (200g)', gram_weight: 200 }
    ],
    source: 'turkomp',
    search_tags: ['karnıyarık', 'patlıcan', 'kıymalı']
  },
  {
    food_name: 'İmam Bayıldı (Zeytinyağlı)',
    food_name_en: 'Imam Bayildi (Eggplant Stewed in Olive Oil)',
    unit_type: 'gram',
    per_unit: per100g(92, 1.6, 8.4, 6.2, 3.8, 2.8),
    portions: [
      { name: '1 Adet (170g)', gram_weight: 170 },
      { name: '1 Porsiyon (200g)', gram_weight: 200 }
    ],
    source: 'turkomp',
    search_tags: ['imam bayıldı', 'patlıcan', 'zeytinyağlı']
  },
  {
    food_name: 'Taze Fasulye (Zeytinyağlı)',
    food_name_en: 'Green Beans with Olive Oil',
    unit_type: 'gram',
    per_unit: per100g(54, 1.8, 5.6, 2.8, 2.6, 2.7),
    portions: [
      { name: '1 Porsiyon (200g)', gram_weight: 200 },
      { name: '1 Yemek Kaşığı (25g)', gram_weight: 25 }
    ],
    source: 'turkomp',
    search_tags: ['taze fasulye', 'zeytinyağlı', 'sebze']
  },
  {
    food_name: 'Yaprak Sarması (Zeytinyağlı)',
    food_name_en: 'Stuffed Grape Leaves with Rice (Sarma)',
    unit_type: 'gram',
    per_unit: per100g(172, 3.4, 24.5, 6.8, 2.1, 2.4),
    portions: [
      { name: '1 Adet Sarma (25g)', gram_weight: 25 },
      { name: '1 Porsiyon (5 Adet - 125g)', gram_weight: 125 },
      { name: '1 Porsiyon (8 Adet - 200g)', gram_weight: 200 }
    ],
    source: 'turkomp',
    search_tags: ['yaprak sarma', 'zeytinyağlı sarma', 'dolma']
  },
  {
    food_name: 'Yaprak Sarması (Etli)',
    food_name_en: 'Stuffed Grape Leaves with Minced Meat',
    unit_type: 'gram',
    per_unit: per100g(155, 6.8, 16.2, 7.1, 1.2, 2.1),
    portions: [
      { name: '1 Adet Sarma (30g)', gram_weight: 30 },
      { name: '1 Porsiyon (6 Adet - 180g)', gram_weight: 180 }
    ],
    source: 'turkomp',
    search_tags: ['etli yaprak sarma', 'etli sarma', 'dolma']
  },
  {
    food_name: 'Biber Dolması (Kıymalı)',
    food_name_en: 'Stuffed Bell Peppers with Meat',
    unit_type: 'gram',
    per_unit: per100g(124, 5.6, 12.1, 5.8, 2.2, 1.9),
    portions: [
      { name: '1 Adet Dolma (130g)', gram_weight: 130 },
      { name: '2 Adet Dolma (260g)', gram_weight: 260 }
    ],
    source: 'turkomp',
    search_tags: ['biber dolması', 'etli dolma', 'kıymalı dolma']
  },
  {
    food_name: 'Biber Dolması (Zeytinyağlı)',
    food_name_en: 'Stuffed Bell Peppers with Rice (Olive Oil)',
    unit_type: 'gram',
    per_unit: per100g(148, 2.6, 21.4, 5.9, 3.4, 2.1),
    portions: [
      { name: '1 Adet Dolma (120g)', gram_weight: 120 },
      { name: '2 Adet Dolma (240g)', gram_weight: 240 }
    ],
    source: 'turkomp',
    search_tags: ['zeytinyağlı biber dolması', 'pirinçli dolma']
  },
  {
    food_name: 'İzmir Köfte',
    food_name_en: 'Izmir Kofte (Meatballs with Potatoes and Tomato Sauce)',
    unit_type: 'gram',
    per_unit: per100g(148, 8.4, 9.6, 8.6, 1.8, 1.4),
    portions: [
      { name: '1 Porsiyon (4 köfte + patates - 250g)', gram_weight: 250 },
      { name: '1 Adet Köfte (35g)', gram_weight: 35 }
    ],
    source: 'turkomp',
    search_tags: ['izmir köfte', 'köfte', 'fırın köfte patates']
  },
  {
    food_name: 'Kuru Köfte (Anne Köftesi)',
    food_name_en: 'Pan-Fried Turkish Meatballs (Kuru Kofte)',
    unit_type: 'gram',
    per_unit: per100g(245, 17.5, 6.2, 16.8, 0.4, 0.6),
    portions: [
      { name: '1 Adet Köfte (30g)', gram_weight: 30 },
      { name: '1 Porsiyon (5 Adet - 150g)', gram_weight: 150 },
      { name: '1 Porsiyon (6 Adet - 180g)', gram_weight: 180 }
    ],
    source: 'turkomp',
    search_tags: ['köfte', 'kuru köfte', 'ızgara köfte', 'anne köftesi']
  },
  {
    food_name: 'Tavuk Sote',
    food_name_en: 'Sauteed Chicken with Peppers and Tomatoes',
    unit_type: 'gram',
    per_unit: per100g(118, 15.2, 3.4, 4.8, 1.9, 1.1),
    portions: [
      { name: '1 Porsiyon (200g)', gram_weight: 200 },
      { name: '1 Tabak (250g)', gram_weight: 250 },
      { name: '1 Yemek Kaşığı (25g)', gram_weight: 25 }
    ],
    source: 'turkomp',
    search_tags: ['tavuk sote', 'tavuk göğsü', 'tencere tavuk']
  },
  {
    food_name: 'Tas Kebabı',
    food_name_en: 'Turkish Beef Stew with Potatoes (Tas Kebabi)',
    unit_type: 'gram',
    per_unit: per100g(165, 13.8, 6.4, 9.4, 1.2, 1.1),
    portions: [
      { name: '1 Porsiyon (200g)', gram_weight: 200 },
      { name: '1 Tabak (250g)', gram_weight: 250 }
    ],
    source: 'turkomp',
    search_tags: ['tas kebabı', 'dana eti', 'etli yemek']
  },
  {
    food_name: 'Pirinç Pilavı (Şehriyeli)',
    food_name_en: 'Turkish Rice Pilaf with Orzo',
    unit_type: 'gram',
    per_unit: per100g(178, 3.2, 31.4, 4.2, 0.2, 0.8),
    portions: [
      { name: '1 Porsiyon (150g)', gram_weight: 150 },
      { name: '1 Tabak (200g)', gram_weight: 200 },
      { name: '1 Yemek Kaşığı (25g)', gram_weight: 25 },
      { name: '1 Su Bardağı Pişmiş (180g)', gram_weight: 180 }
    ],
    source: 'turkomp',
    search_tags: ['pilav', 'pirinç pilavı', 'şehriyeli pilav']
  },
  {
    food_name: 'Bulgur Pilavı (Meyhane / Sebzeli)',
    food_name_en: 'Bulgur Pilaf with Tomatoes and Peppers',
    unit_type: 'gram',
    per_unit: per100g(124, 3.6, 21.8, 2.6, 1.5, 3.8),
    portions: [
      { name: '1 Porsiyon (150g)', gram_weight: 150 },
      { name: '1 Tabak (200g)', gram_weight: 200 },
      { name: '1 Yemek Kaşığı (25g)', gram_weight: 25 }
    ],
    source: 'turkomp',
    search_tags: ['bulgur pilavı', 'meyhane pilavı', 'sebzeli bulgur']
  },
  {
    food_name: 'Kayseri Mantısı (Yoğurtlu & Soslu)',
    food_name_en: 'Turkish Dumplings (Manti) with Yogurt and Butter Sauce',
    unit_type: 'gram',
    per_unit: per100g(195, 7.2, 27.5, 6.4, 1.8, 1.5),
    portions: [
      { name: '1 Porsiyon (250g)', gram_weight: 250 },
      { name: '1 Tabak (300g)', gram_weight: 300 }
    ],
    source: 'turkomp',
    search_tags: ['mantı', 'kayseri mantısı', 'yoğurtlu mantı']
  },

  // ─── 3. KEBAPLAR, PİDELER & SOKAK LEZZETLERİ ───
  {
    food_name: 'Lahmacun',
    food_name_en: 'Lahmacun (Turkish Flatbread with Minced Meat)',
    unit_type: 'adet',
    per_unit: { calories: 240, protein_g: 9.8, carbs_g: 32.5, fat_g: 7.8, sugar_g: 2.1, fiber_g: 2.4 },
    portions: [
      { name: '1 Adet Standart (130g)', gram_weight: 130 },
      { name: '1 Adet Fındık Lahmacun (50g)', gram_weight: 50 }
    ],
    source: 'turkomp',
    search_tags: ['lahmacun', 'pide', 'kebap']
  },
  {
    food_name: 'Adana Kebap',
    food_name_en: 'Adana Kebab (Spicy Minced Lamb Skewer)',
    unit_type: 'gram',
    per_unit: per100g(280, 18.5, 2.4, 22.0, 0.4, 0.8),
    portions: [
      { name: '1 Porsiyon Şiş (150g)', gram_weight: 150 },
      { name: '1 Dürüm (Lavaşlı - 250g)', gram_weight: 250 }
    ],
    source: 'turkomp',
    search_tags: ['adana kebap', 'kebap', 'dürüm', 'kıyma kebap']
  },
  {
    food_name: 'Urfa Kebap',
    food_name_en: 'Urfa Kebab (Mild Minced Meat Skewer)',
    unit_type: 'gram',
    per_unit: per100g(270, 18.2, 2.1, 21.2, 0.4, 0.8),
    portions: [
      { name: '1 Porsiyon Şiş (150g)', gram_weight: 150 },
      { name: '1 Dürüm (Lavaşlı - 250g)', gram_weight: 250 }
    ],
    source: 'turkomp',
    search_tags: ['urfa kebap', 'acısız kebap', 'dürüm']
  },
  {
    food_name: 'İskender Kebap',
    food_name_en: 'Iskender Kebab (Doner with Pita, Tomato Sauce and Butter)',
    unit_type: 'gram',
    per_unit: per100g(215, 12.8, 14.5, 12.2, 1.8, 1.1),
    portions: [
      { name: '1 Porsiyon (300g)', gram_weight: 300 },
      { name: '1.5 Porsiyon (450g)', gram_weight: 450 }
    ],
    source: 'turkomp',
    search_tags: ['iskender', 'döner', 'bursa iskender', 'tereyağlı iskender']
  },
  {
    food_name: 'Tavuk Döner Dürüm',
    food_name_en: 'Chicken Doner Wrap',
    unit_type: 'adet',
    per_unit: { calories: 480, protein_g: 28.5, carbs_g: 52.0, fat_g: 17.5, sugar_g: 3.2, fiber_g: 3.5 },
    portions: [
      { name: '1 Adet Standart Dürüm (220g)', gram_weight: 220 },
      { name: '1 Adet Zurna Dürüm (350g)', gram_weight: 350 }
    ],
    source: 'turkomp',
    search_tags: ['tavuk döner', 'dürüm', 'döner']
  },
  {
    food_name: 'Kıymalı Kaşarlı Pide',
    food_name_en: 'Turkish Pide with Minced Meat and Melted Cheese',
    unit_type: 'adet',
    per_unit: { calories: 650, protein_g: 28.0, carbs_g: 78.0, fat_g: 24.5, sugar_g: 4.1, fiber_g: 4.2 },
    portions: [
      { name: '1 Porsiyon / Adet (280g)', gram_weight: 280 },
      { name: '1 Dilim / Parça (45g)', gram_weight: 45 }
    ],
    source: 'turkomp',
    search_tags: ['pide', 'kıymalı pide', 'kaşarlı pide']
  },
  {
    food_name: 'Kuşbaşılı Kaşarlı Pide',
    food_name_en: 'Turkish Pide with Diced Beef and Melted Cheese',
    unit_type: 'adet',
    per_unit: { calories: 680, protein_g: 32.0, carbs_g: 76.0, fat_g: 26.0, sugar_g: 4.2, fiber_g: 4.1 },
    portions: [
      { name: '1 Porsiyon / Adet (300g)', gram_weight: 300 },
      { name: '1 Dilim (50g)', gram_weight: 50 }
    ],
    source: 'turkomp',
    search_tags: ['kuşbaşılı pide', 'pide']
  },
  {
    food_name: 'Çiğ Köfte (Etsiz)',
    food_name_en: 'Turkish Bulgur Patties (Cig Kofte)',
    unit_type: 'gram',
    per_unit: per100g(185, 4.8, 32.4, 4.2, 2.5, 4.5),
    portions: [
      { name: '1 Adet Sıkım (35g)', gram_weight: 35 },
      { name: '1 Porsiyon (6 Sıkım - 210g)', gram_weight: 210 },
      { name: '1 Dürüm (Lavaşlı - 200g)', gram_weight: 200 }
    ],
    source: 'turkomp',
    search_tags: ['çiğ köfte', 'etsiz çiğ köfte', 'dürüm']
  },

  // ─── 4. KAHVALTILIKLAR & HAMUR İŞLERİ ───
  {
    food_name: 'Menemen',
    food_name_en: 'Turkish Scrambled Eggs with Tomatoes and Peppers (Menemen)',
    unit_type: 'gram',
    per_unit: per100g(112, 5.4, 4.2, 8.1, 2.6, 1.2),
    portions: [
      { name: '1 Porsiyon (2 Yumurtalı - 200g)', gram_weight: 200 },
      { name: '1 Yemek Kaşığı (30g)', gram_weight: 30 }
    ],
    source: 'turkomp',
    search_tags: ['menemen', 'yumurta', 'kahvaltı']
  },
  {
    food_name: 'Sucuklu Yumurta',
    food_name_en: 'Fried Eggs with Turkish Pepperoni (Sucuk)',
    unit_type: 'gram',
    per_unit: per100g(245, 14.8, 1.2, 20.4, 0.4, 0),
    portions: [
      { name: '1 Porsiyon (160g)', gram_weight: 160 }
    ],
    source: 'turkomp',
    search_tags: ['sucuklu yumurta', 'sucuk', 'sahanda yumurta', 'kahvaltı']
  },
  {
    food_name: 'Simit (Susamlı Sokak Simidi)',
    food_name_en: 'Turkish Sesame Bagel (Simit)',
    unit_type: 'adet',
    per_unit: { calories: 340, protein_g: 10.5, carbs_g: 58.0, fat_g: 7.2, sugar_g: 3.5, fiber_g: 3.8 },
    portions: [
      { name: '1 Adet (100g)', gram_weight: 100 },
      { name: 'Yarım Simit (50g)', gram_weight: 50 }
    ],
    source: 'turkomp',
    search_tags: ['simit', 'susamlı simit', 'kahvaltı', 'gevrek']
  },
  {
    food_name: 'Açma (Sade)',
    food_name_en: 'Turkish Soft Pastry Ring (Acma)',
    unit_type: 'adet',
    per_unit: { calories: 380, protein_g: 8.2, carbs_g: 52.0, fat_g: 15.5, sugar_g: 4.8, fiber_g: 2.2 },
    portions: [
      { name: '1 Adet (110g)', gram_weight: 110 }
    ],
    source: 'turkomp',
    search_tags: ['açma', 'pastane', 'kahvaltı']
  },
  {
    food_name: 'Peynirli Poğaça',
    food_name_en: 'Turkish Pastry with Feta Cheese (Pogaca)',
    unit_type: 'adet',
    per_unit: { calories: 290, protein_g: 7.4, carbs_g: 34.0, fat_g: 14.0, sugar_g: 2.8, fiber_g: 1.8 },
    portions: [
      { name: '1 Adet (90g)', gram_weight: 90 }
    ],
    source: 'turkomp',
    search_tags: ['poğaça', 'peynirli poğaça', 'pastane']
  },
  {
    food_name: 'Kaşarlı Poğaça',
    food_name_en: 'Turkish Pastry with Kashar Cheese',
    unit_type: 'adet',
    per_unit: { calories: 330, protein_g: 8.5, carbs_g: 35.0, fat_g: 17.5, sugar_g: 2.9, fiber_g: 1.7 },
    portions: [
      { name: '1 Adet (95g)', gram_weight: 95 }
    ],
    source: 'turkomp',
    search_tags: ['kaşarlı poğaça', 'poğaça']
  },
  {
    food_name: 'Su Böreği (Peynirli)',
    food_name_en: 'Turkish Water Borek with Cheese',
    unit_type: 'gram',
    per_unit: per100g(275, 9.4, 28.5, 14.2, 1.8, 1.4),
    portions: [
      { name: '1 Porsiyon / Dilim (150g)', gram_weight: 150 },
      { name: 'Büyük Dilim (200g)', gram_weight: 200 }
    ],
    source: 'turkomp',
    search_tags: ['su böreği', 'börek', 'peynirli börek']
  },
  {
    food_name: 'Sigara Böreği (Kızartma)',
    food_name_en: 'Fried Rolled Pastry with Feta Cheese (Sigara Boregi)',
    unit_type: 'adet',
    per_unit: { calories: 85, protein_g: 2.4, carbs_g: 9.8, fat_g: 4.1, sugar_g: 0.5, fiber_g: 0.5 },
    portions: [
      { name: '1 Adet (30g)', gram_weight: 30 },
      { name: '1 Porsiyon (4 Adet - 120g)', gram_weight: 120 }
    ],
    source: 'turkomp',
    search_tags: ['sigara böreği', 'börek', 'kalem börek']
  },
  {
    food_name: 'Beyaz Peynir (Tam Yağlı)',
    food_name_en: 'Turkish White Cheese (Full Fat)',
    unit_type: 'gram',
    per_unit: per100g(260, 16.5, 1.8, 21.0, 1.8, 0),
    portions: [
      { name: '1 Dilim (30g)', gram_weight: 30 },
      { name: '1 Kibrit Kutusu Büyüklüğünde (30g)', gram_weight: 30 },
      { name: '1 Yemek Kaşığı (20g)', gram_weight: 20 }
    ],
    source: 'turkomp',
    search_tags: ['beyaz peynir', 'peynir', 'ezine', 'kahvaltı']
  },
  {
    food_name: 'Kaşar Peyniri (Eski)',
    food_name_en: 'Aged Kashar Cheese',
    unit_type: 'gram',
    per_unit: per100g(380, 28.5, 1.2, 29.4, 0.8, 0),
    portions: [
      { name: '1 Dilim (25g)', gram_weight: 25 },
      { name: '1 Kibrit Kutusu (30g)', gram_weight: 30 }
    ],
    source: 'turkomp',
    search_tags: ['eski kaşar', 'kaşar', 'peynir', 'kars kaşarı']
  },
  {
    food_name: 'Kaşar Peyniri (Taze)',
    food_name_en: 'Fresh Kashar Cheese',
    unit_type: 'gram',
    per_unit: per100g(345, 25.2, 2.1, 26.5, 1.2, 0),
    portions: [
      { name: '1 Dilim (25g)', gram_weight: 25 },
      { name: '1 Kibrit Kutusu (30g)', gram_weight: 30 }
    ],
    source: 'turkomp',
    search_tags: ['taze kaşar', 'kaşar', 'tost peyniri']
  },
  {
    food_name: 'Lor Peyniri',
    food_name_en: 'Curd Cheese (Lor)',
    unit_type: 'gram',
    per_unit: per100g(98, 14.2, 3.2, 2.8, 2.4, 0),
    portions: [
      { name: '1 Porsiyon (100g)', gram_weight: 100 },
      { name: '1 Yemek Kaşığı (30g)', gram_weight: 30 },
      { name: '1 Su Bardağı (150g)', gram_weight: 150 }
    ],
    source: 'turkomp',
    search_tags: ['lor peyniri', 'lor', 'sporcu peyniri', 'yağsız peynir']
  },
  {
    food_name: 'Zeytin (Siyah)',
    food_name_en: 'Black Olives',
    unit_type: 'adet',
    per_unit: { calories: 8, protein_g: 0.1, carbs_g: 0.3, fat_g: 0.8, sugar_g: 0.1, fiber_g: 0.2 },
    portions: [
      { name: '1 Adet (4g)', gram_weight: 4 },
      { name: '5 Adet (20g)', gram_weight: 20 },
      { name: '10 Adet (40g)', gram_weight: 40 },
      { name: '1 Avuç (30g)', gram_weight: 30 }
    ],
    source: 'turkomp',
    search_tags: ['zeytin', 'siyah zeytin', 'kahvaltı']
  },
  {
    food_name: 'Zeytin (Yeşil)',
    food_name_en: 'Green Olives',
    unit_type: 'adet',
    per_unit: { calories: 6, protein_g: 0.1, carbs_g: 0.2, fat_g: 0.6, sugar_g: 0.1, fiber_g: 0.2 },
    portions: [
      { name: '1 Adet (4g)', gram_weight: 4 },
      { name: '5 Adet (20g)', gram_weight: 20 },
      { name: '10 Adet (40g)', gram_weight: 40 }
    ],
    source: 'turkomp',
    search_tags: ['yeşil zeytin', 'kırma zeytin', 'çizik zeytin']
  },
  {
    food_name: 'Tahin & Pekmez Karışımı',
    food_name_en: 'Tahini and Molasses Mix',
    unit_type: 'gram',
    per_unit: per100g(475, 9.8, 54.2, 24.5, 46.0, 3.2),
    portions: [
      { name: '1 Yemek Kaşığı (20g)', gram_weight: 20 },
      { name: '1 Tatlı Kaşığı (10g)', gram_weight: 10 }
    ],
    source: 'turkomp',
    search_tags: ['tahin pekmez', 'pekmez', 'tahin']
  },
  {
    food_name: 'Bal (Süzme Çiçek)',
    food_name_en: 'Pure Honey',
    unit_type: 'gram',
    per_unit: per100g(304, 0.3, 82.4, 0, 82.1, 0.2),
    portions: [
      { name: '1 Yemek Kaşığı (20g)', gram_weight: 20 },
      { name: '1 Tatlı Kaşığı (10g)', gram_weight: 10 },
      { name: '1 Çay Kaşığı (5g)', gram_weight: 5 }
    ],
    source: 'turkomp',
    search_tags: ['bal', 'süzme bal', 'tatlı']
  },
  {
    food_name: 'Zeytinyağı (Sızma)',
    food_name_en: 'Extra Virgin Olive Oil',
    unit_type: 'gram',
    per_unit: per100g(884, 0, 0, 100, 0, 0),
    portions: [
      { name: '1 Yemek Kaşığı (10g)', gram_weight: 10 },
      { name: '1 Tatlı Kaşığı (5g)', gram_weight: 5 },
      { name: '1 Çay Kaşığı (2g)', gram_weight: 2 }
    ],
    source: 'turkomp',
    search_tags: ['zeytinyağı', 'sızma zeytinyağı', 'yağ']
  },
  {
    food_name: 'Tereyağı',
    food_name_en: 'Butter',
    unit_type: 'gram',
    per_unit: per100g(717, 0.8, 0.1, 81.1, 0.1, 0),
    portions: [
      { name: '1 Yemek Kaşığı (15g)', gram_weight: 15 },
      { name: '1 Tatlı Kaşığı (8g)', gram_weight: 8 },
      { name: '1 Çay Kaşığı (4g)', gram_weight: 4 }
    ],
    source: 'turkomp',
    search_tags: ['tereyağı', 'köy tereyağı', 'kahvaltı']
  },

  // ─── 5. POPÜLER RESTORAN ZİNCİRLERİ ───
  // Köfteci Yusuf
  {
    food_name: 'Köfteci Yusuf Porsiyon Kasap Köfte (200g)',
    food_name_en: 'Kofteci Yusuf Butcher Meatballs (200g)',
    brand_name: 'Köfteci Yusuf',
    unit_type: 'gram',
    per_unit: per100g(233, 16.0, 4.2, 16.8, 0.4, 0.6),
    portions: [
      { name: '1 Porsiyon (5 Köfte - 200g)', gram_weight: 200 },
      { name: '1.5 Porsiyon (300g)', gram_weight: 300 },
      { name: '1 Adet Köfte (40g)', gram_weight: 40 }
    ],
    source: 'restaurant',
    search_tags: ['köfteci yusuf', 'köfte', 'kasap köfte']
  },
  {
    food_name: 'Köfteci Yusuf Izgara Sucuk',
    food_name_en: 'Kofteci Yusuf Grilled Sucuk',
    brand_name: 'Köfteci Yusuf',
    unit_type: 'gram',
    per_unit: per100g(345, 16.2, 2.1, 30.5, 0.8, 0.5),
    portions: [
      { name: '1 Porsiyon (200g)', gram_weight: 200 },
      { name: '1 Kangal Porsiyon (150g)', gram_weight: 150 }
    ],
    source: 'restaurant',
    search_tags: ['köfteci yusuf', 'sucuk', 'ızgara sucuk']
  },
  {
    food_name: 'Köfteci Yusuf Kavurmalı Sucuklu Kaşarlı Tost',
    food_name_en: 'Kofteci Yusuf Mixed Toast (Kavurma, Sucuk, Cheese)',
    brand_name: 'Köfteci Yusuf',
    unit_type: 'adet',
    per_unit: { calories: 685, protein_g: 32.0, carbs_g: 48.0, fat_g: 41.0, sugar_g: 3.5, fiber_g: 3.2 },
    portions: [
      { name: '1 Adet Tam Tost (220g)', gram_weight: 220 },
      { name: 'Yarım Tost (110g)', gram_weight: 110 }
    ],
    source: 'restaurant',
    search_tags: ['köfteci yusuf', 'tost', 'kavurmalı tost']
  },
  {
    food_name: 'Köfteci Yusuf Trileçe (Karamelli)',
    food_name_en: 'Kofteci Yusuf Caramel Trilece',
    brand_name: 'Köfteci Yusuf',
    unit_type: 'adet',
    per_unit: { calories: 385, protein_g: 7.5, carbs_g: 48.0, fat_g: 18.0, sugar_g: 38.0, fiber_g: 0.5 },
    portions: [
      { name: '1 Dilim / Porsiyon (170g)', gram_weight: 170 }
    ],
    source: 'restaurant',
    search_tags: ['köfteci yusuf', 'trileçe', 'tatlı']
  },

  // Starbucks
  {
    food_name: 'Starbucks Caffè Americano (Tall)',
    food_name_en: 'Starbucks Caffe Americano (Tall)',
    brand_name: 'Starbucks',
    unit_type: 'adet',
    per_unit: { calories: 11, protein_g: 0.8, carbs_g: 2.0, fat_g: 0.1, sugar_g: 0, fiber_g: 0 },
    portions: [
      { name: 'Tall (Küçük - 354ml)', gram_weight: 354 },
      { name: 'Grande (Orta - 473ml)', gram_weight: 473 },
      { name: 'Venti (Büyük - 591ml)', gram_weight: 591 }
    ],
    source: 'restaurant',
    search_tags: ['starbucks', 'kahve', 'americano', 'espresso']
  },
  {
    food_name: 'Starbucks Caffè Latte (Tall - Yağsız Sütlü)',
    food_name_en: 'Starbucks Caffe Latte (Tall - Nonfat Milk)',
    brand_name: 'Starbucks',
    unit_type: 'adet',
    per_unit: { calories: 102, protein_g: 10.0, carbs_g: 15.0, fat_g: 0.2, sugar_g: 14.0, fiber_g: 0 },
    portions: [
      { name: 'Tall (354ml)', gram_weight: 354 },
      { name: 'Grande (473ml)', gram_weight: 473 }
    ],
    source: 'restaurant',
    search_tags: ['starbucks', 'latte', 'kahve', 'sütlü kahve']
  },
  {
    food_name: 'Starbucks Iced Caramel Macchiato (Grande)',
    food_name_en: 'Starbucks Iced Caramel Macchiato (Grande)',
    brand_name: 'Starbucks',
    unit_type: 'adet',
    per_unit: { calories: 250, protein_g: 10.0, carbs_g: 35.0, fat_g: 7.0, sugar_g: 32.0, fiber_g: 0 },
    portions: [
      { name: 'Grande (473ml)', gram_weight: 473 },
      { name: 'Venti (591ml)', gram_weight: 591 }
    ],
    source: 'restaurant',
    search_tags: ['starbucks', 'caramel macchiato', 'soğuk kahve', 'karamel']
  },

  // Tavuk Dünyası
  {
    food_name: 'Tavuk Dünyası Kekiklim (Tavuk + Makarna + Salata)',
    food_name_en: 'Tavuk Dunyasi Thyme Chicken with Pasta and Salad',
    brand_name: 'Tavuk Dünyası',
    unit_type: 'adet',
    per_unit: { calories: 840, protein_g: 52.0, carbs_g: 88.0, fat_g: 31.0, sugar_g: 4.5, fiber_g: 6.2 },
    portions: [
      { name: '1 Tam Porsiyon Tabak (450g)', gram_weight: 450 }
    ],
    source: 'restaurant',
    search_tags: ['tavuk dünyası', 'kekiklim', 'tavuk', 'makarna']
  },
  {
    food_name: 'Tavuk Dünyası Şefin Tavası',
    food_name_en: 'Tavuk Dunyasi Chefs Pan Chicken',
    brand_name: 'Tavuk Dünyası',
    unit_type: 'adet',
    per_unit: { calories: 890, protein_g: 54.0, carbs_g: 92.0, fat_g: 34.0, sugar_g: 5.2, fiber_g: 5.8 },
    portions: [
      { name: '1 Tam Porsiyon Tabak (460g)', gram_weight: 460 }
    ],
    source: 'restaurant',
    search_tags: ['tavuk dünyası', 'şefin tavası', 'tavuk']
  },

  // Burger King
  {
    food_name: 'Burger King Whopper',
    food_name_en: 'Burger King Whopper Burger',
    brand_name: 'Burger King',
    unit_type: 'adet',
    per_unit: { calories: 657, protein_g: 28.0, carbs_g: 49.0, fat_g: 39.0, sugar_g: 11.0, fiber_g: 3.5 },
    portions: [
      { name: '1 Adet Standart (270g)', gram_weight: 270 }
    ],
    source: 'restaurant',
    search_tags: ['burger king', 'whopper', 'hamburger', 'fast food']
  },
  {
    food_name: 'Burger King King Nuggets (6 Parça)',
    food_name_en: 'Burger King Nuggets (6 Pieces)',
    brand_name: 'Burger King',
    unit_type: 'adet',
    per_unit: { calories: 260, protein_g: 12.0, carbs_g: 17.0, fat_g: 16.0, sugar_g: 0.5, fiber_g: 1.2 },
    portions: [
      { name: '6 Parça Kutu (100g)', gram_weight: 100 },
      { name: '9 Parça Kutu (150g)', gram_weight: 150 }
    ],
    source: 'restaurant',
    search_tags: ['burger king', 'nugget', 'tavuk nugget']
  },

  // McDonald's
  {
    food_name: "McDonald's Big Mac",
    food_name_en: "McDonald's Big Mac",
    brand_name: "McDonald's",
    unit_type: 'adet',
    per_unit: { calories: 550, protein_g: 25.0, carbs_g: 45.0, fat_g: 30.0, sugar_g: 9.0, fiber_g: 3.0 },
    portions: [
      { name: '1 Adet Standart (215g)', gram_weight: 215 }
    ],
    source: 'restaurant',
    search_tags: ["mcdonald's", 'big mac', 'hamburger', 'fast food']
  },
  {
    food_name: "McDonald's McChicken",
    food_name_en: "McDonald's McChicken",
    brand_name: "McDonald's",
    unit_type: 'adet',
    per_unit: { calories: 430, protein_g: 15.0, carbs_g: 44.0, fat_g: 21.0, sugar_g: 5.0, fiber_g: 2.5 },
    portions: [
      { name: '1 Adet (145g)', gram_weight: 145 }
    ],
    source: 'restaurant',
    search_tags: ["mcdonald's", 'mcchicken', 'tavuk burger']
  },

  // Domino's Pizza
  {
    food_name: "Domino's Karışık Pizza (Orta Boy)",
    food_name_en: "Domino's Mixed Pizza (Medium)",
    brand_name: "Domino's Pizza",
    unit_type: 'dilim',
    per_unit: { calories: 195, protein_g: 8.5, carbs_g: 22.0, fat_g: 8.0, sugar_g: 2.1, fiber_g: 1.4 },
    portions: [
      { name: '1 Dilim (75g)', gram_weight: 75 },
      { name: '2 Dilim (150g)', gram_weight: 150 },
      { name: '1 Bütün Orta Pizza (8 Dilim - 600g)', gram_weight: 600 }
    ],
    source: 'restaurant',
    search_tags: ["domino's", 'pizza', 'karışık pizza']
  }
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI bulunamadı.');
    process.exit(1);
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.useDb('dailymanagament');
  const collection = db.collection('foodcaches');

  console.log(`🚀 Toplam ${MASTER_FOODS.length} adet TÜRKOMP & Restoran ürünü hazırlanıyor...`);

  let addedCount = 0;
  let skippedCount = 0;

  for (const food of MASTER_FOODS) {
    const cleanName = food.food_name.trim();
    const cleanBrand = food.brand_name ? food.brand_name.trim() : null;

    // Check if food already exists by food_name and brand_name (never overwrite!)
    const query = {
      food_name: { $regex: `^${cleanName}$`, $options: 'i' },
      brand_name: cleanBrand
    };

    const existing = await collection.findOne(query);

    if (existing) {
      // If existing does not have portions, we can safely enrich with portions without changing macros
      if ((!existing.portions || existing.portions.length === 0) && food.portions?.length) {
        await collection.updateOne({ _id: existing._id }, { $set: { portions: food.portions } });
      }
      skippedCount++;
    } else {
      try {
        await collection.insertOne({
          ...food,
          food_name: cleanName,
          brand_name: cleanBrand,
          user_id: null,
          created_at: new Date(),
          updated_at: new Date()
        });
        addedCount++;
      } catch (err) {
        if (err.code === 11000) {
          skippedCount++;
        } else {
          throw err;
        }
      }
    }
  }

  console.log(`✅ İşlem tamamlandı: ${addedCount} yeni ürün eklendi, ${skippedCount} mevcut ürün korundu.`);
  const total = await collection.countDocuments();
  console.log(`📊 Güncel toplam FoodCache kayıt sayısı: ${total}`);

  await mongoose.disconnect();
}

main().catch(console.error);
