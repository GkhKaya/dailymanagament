/**
 * Türkçe besin veritabanı seed scripti
 * Çalıştırmak için: node scripts/seed-foods.mjs
 *
 * Tüm gram-bazlı ürünlerde per_unit değerleri 1 gram içindir.
 * Adet-bazlı ürünlerde per_unit değerleri 1 adet içindir.
 */

import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';

// .env.local dosyasını manuel parse et
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
    console.warn('⚠️ .env.local okunamadı, mevcut env değişkenleri kullanılıyor.');
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'dailymanagament';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI bulunamadı. .env.local dosyasını kontrol edin.');
  process.exit(1);
}

// Helper: gram başına değerleri 100g değerlerinden hesapla
function per100g(cal, pro, carb, fat, fib = 0) {
  return {
    calories: cal / 100,
    protein_g: pro / 100,
    carbs_g: carb / 100,
    fat_g: fat / 100,
    fiber_g: fib / 100,
  };
}

// Helper: adet için sabit değerler
function perUnit(cal, pro, carb, fat, fib = 0) {
  return { calories: cal, protein_g: pro, carbs_g: carb, fat_g: fat, fiber_g: fib };
}

const now = new Date();

// ============================================================
// ÇORBALAR (gram bazlı, pişmiş/hazır hali - 100g başına)
// ============================================================
const soups = [
  { food_name: 'Ezogelin Çorbası', food_name_en: 'Ezogelin Soup', tags: ['çorba', 'soup', 'ezogelin', 'kırmızı mercimek', 'bulgur'], ...per100g(65, 3.8, 10.5, 1.2, 2.1) },
  { food_name: 'Mercimek Çorbası', food_name_en: 'Lentil Soup', tags: ['çorba', 'soup', 'mercimek', 'lentil'], ...per100g(55, 3.5, 8.5, 1.0, 2.5) },
  { food_name: 'Domates Çorbası', food_name_en: 'Tomato Soup', tags: ['çorba', 'soup', 'domates', 'tomato'], ...per100g(40, 1.5, 6.0, 1.2, 0.8) },
  { food_name: 'Tarhana Çorbası', food_name_en: 'Tarhana Soup', tags: ['çorba', 'soup', 'tarhana'], ...per100g(62, 2.8, 9.5, 1.5, 1.2) },
  { food_name: 'Yayla Çorbası', food_name_en: 'Yayla Soup (Yogurt Soup)', tags: ['çorba', 'soup', 'yayla', 'yoğurt', 'pirinç'], ...per100g(68, 3.5, 6.5, 3.2, 0.3) },
  { food_name: 'İşkembe Çorbası', food_name_en: 'Tripe Soup', tags: ['çorba', 'soup', 'işkembe', 'tripe'], ...per100g(58, 5.5, 3.0, 3.0, 0) },
  { food_name: 'Paça Çorbası', food_name_en: 'Pacha Soup', tags: ['çorba', 'soup', 'paça'], ...per100g(72, 7.5, 2.0, 4.0, 0) },
  { food_name: 'Düğün Çorbası', food_name_en: 'Wedding Soup', tags: ['çorba', 'soup', 'düğün'], ...per100g(85, 6.5, 4.5, 4.8, 0.2) },
  { food_name: 'Şehriye Çorbası', food_name_en: 'Vermicelli Soup', tags: ['çorba', 'soup', 'şehriye', 'vermicelli'], ...per100g(58, 2.5, 8.5, 1.5, 0.4) },
  { food_name: 'Tavuk Suyu Çorbası', food_name_en: 'Chicken Broth Soup', tags: ['çorba', 'soup', 'tavuk suyu', 'chicken broth'], ...per100g(28, 2.5, 2.5, 0.8, 0.1) },
  { food_name: 'Mantar Çorbası', food_name_en: 'Mushroom Soup', tags: ['çorba', 'soup', 'mantar', 'mushroom'], ...per100g(45, 2.0, 6.0, 1.5, 0.8) },
  { food_name: 'Balkabağı Çorbası', food_name_en: 'Pumpkin Soup', tags: ['çorba', 'soup', 'balkabağı', 'pumpkin'], ...per100g(42, 1.2, 7.5, 1.2, 1.0) },
  { food_name: 'Brokoli Çorbası', food_name_en: 'Broccoli Soup', tags: ['çorba', 'soup', 'brokoli', 'broccoli'], ...per100g(38, 2.2, 5.0, 1.3, 1.5) },
  { food_name: 'Kremalı Sebze Çorbası', food_name_en: 'Creamy Vegetable Soup', tags: ['çorba', 'soup', 'sebze', 'kremalı', 'vegetable'], ...per100g(65, 1.8, 7.5, 3.5, 1.2) },
  { food_name: 'Soğan Çorbası', food_name_en: 'Onion Soup', tags: ['çorba', 'soup', 'soğan', 'onion'], ...per100g(48, 1.5, 8.0, 1.2, 0.8) },
];

// ============================================================
// TAVUK (gram bazlı, pişmiş hali)
// ============================================================
const chicken = [
  { food_name: 'Tavuk Göğsü (Haşlanmış)', food_name_en: 'Boiled Chicken Breast', tags: ['tavuk', 'chicken', 'göğüs', 'breast', 'haşlanmış', 'boiled', 'protein'], ...per100g(165, 31, 0, 3.6, 0) },
  { food_name: 'Tavuk Göğsü (Izgara)', food_name_en: 'Grilled Chicken Breast', tags: ['tavuk', 'chicken', 'göğüs', 'breast', 'ızgara', 'grilled'], ...per100g(165, 31, 0, 3.6, 0) },
  { food_name: 'Tavuk Budu (Derili, Fırın)', food_name_en: 'Chicken Thigh Skin-On Baked', tags: ['tavuk', 'chicken', 'but', 'thigh', 'fırın', 'derili'], ...per100g(229, 25, 0, 14, 0) },
  { food_name: 'Tavuk Budu (Derisiz)', food_name_en: 'Skinless Chicken Thigh', tags: ['tavuk', 'chicken', 'but', 'thigh', 'derisiz', 'skinless'], ...per100g(179, 25, 0, 9.0, 0) },
  { food_name: 'Tavuk Kanat (Fırın)', food_name_en: 'Baked Chicken Wings', tags: ['tavuk', 'chicken', 'kanat', 'wings', 'fırın'], ...per100g(290, 27, 0, 19.5, 0) },
  { food_name: 'Tavuk Kıyması', food_name_en: 'Ground Chicken', tags: ['tavuk', 'chicken', 'kıyma', 'ground'], ...per100g(148, 17, 0, 8.5, 0) },
  { food_name: 'Tavuk Şiş (Izgara)', food_name_en: 'Chicken Shish Kebab Grilled', tags: ['tavuk', 'chicken', 'şiş', 'kebap', 'ızgara', 'shish'], ...per100g(185, 28, 2.5, 6.5, 0) },
  { food_name: 'Tavuk Döner', food_name_en: 'Chicken Doner', tags: ['tavuk', 'chicken', 'döner', 'doner'], ...per100g(195, 24, 4.0, 8.5, 0.2) },
  { food_name: 'Tavuk Köfte', food_name_en: 'Chicken Meatballs', tags: ['tavuk', 'chicken', 'köfte', 'meatball'], ...per100g(175, 20, 8.0, 7.5, 0.5) },
  { food_name: 'Tavuk Sote', food_name_en: 'Chicken Saute', tags: ['tavuk', 'chicken', 'sote', 'fry'], ...per100g(185, 25, 5.0, 7.0, 1.0) },
  { food_name: 'Tavuk Pirzola', food_name_en: 'Chicken Chop', tags: ['tavuk', 'chicken', 'pirzola', 'chop'], ...per100g(220, 26, 1.0, 12.5, 0) },
  { food_name: 'Tavuk Salatası', food_name_en: 'Chicken Salad', tags: ['tavuk', 'chicken', 'salata', 'salad'], ...per100g(130, 18, 4.0, 5.0, 1.0) },
  { food_name: 'Fırın Tavuk (Bütün)', food_name_en: 'Roast Whole Chicken', tags: ['tavuk', 'chicken', 'fırın', 'roast', 'bütün'], ...per100g(239, 27, 0, 14, 0) },
  { food_name: 'Çıtır Tavuk (Kızarmış)', food_name_en: 'Fried Crispy Chicken', tags: ['tavuk', 'chicken', 'çıtır', 'kızarmış', 'fried', 'crispy'], ...per100g(312, 24, 12, 20, 0.5) },
  { food_name: 'Hindi Göğsü', food_name_en: 'Turkey Breast', tags: ['hindi', 'turkey', 'göğüs', 'breast'], ...per100g(157, 30, 0, 3.2, 0) },
  { food_name: 'Tavuk Ciğeri', food_name_en: 'Chicken Liver', tags: ['tavuk', 'chicken', 'ciğer', 'liver'], ...per100g(167, 24.5, 1.0, 7.5, 0) },
  { food_name: 'Tavuk Tandır', food_name_en: 'Chicken Tandoori', tags: ['tavuk', 'chicken', 'tandır', 'tandoori'], ...per100g(205, 26, 3.5, 9.5, 0) },
];

// ============================================================
// KIRMIZI ET (gram bazlı)
// ============================================================
const meat = [
  { food_name: 'Dana Kıyma (Yağlı)', food_name_en: 'Beef Ground Fatty', tags: ['dana', 'beef', 'kıyma', 'ground', 'yağlı'], ...per100g(250, 17, 0, 20, 0) },
  { food_name: 'Dana Kıyma (Yağsız)', food_name_en: 'Lean Ground Beef', tags: ['dana', 'beef', 'kıyma', 'ground', 'yağsız', 'lean'], ...per100g(180, 21, 0, 11, 0) },
  { food_name: 'Dana Antrikot (Izgara)', food_name_en: 'Beef Ribeye Grilled', tags: ['dana', 'beef', 'antrikot', 'ribeye', 'ızgara', 'steak'], ...per100g(290, 24, 0, 22, 0) },
  { food_name: 'Dana Bonfile (Izgara)', food_name_en: 'Beef Tenderloin Grilled', tags: ['dana', 'beef', 'bonfile', 'tenderloin', 'ızgara', 'steak', 'fileto'], ...per100g(212, 28, 0, 11, 0) },
  { food_name: 'Dana Pirzola (Izgara)', food_name_en: 'Beef Chops Grilled', tags: ['dana', 'beef', 'pirzola', 'chops', 'ızgara'], ...per100g(235, 26, 0, 14, 0) },
  { food_name: 'Dana Şiş Kebap', food_name_en: 'Beef Shish Kebab', tags: ['dana', 'beef', 'şiş', 'kebap', 'shish'], ...per100g(220, 24, 3.0, 12, 0) },
  { food_name: 'Adana Kebap', food_name_en: 'Adana Kebab', tags: ['adana', 'kebap', 'kebab', 'kıyma', 'beef'], ...per100g(280, 20, 5.0, 21, 0.5) },
  { food_name: 'Urfa Kebap', food_name_en: 'Urfa Kebab', tags: ['urfa', 'kebap', 'kebab', 'kıyma', 'beef'], ...per100g(265, 20, 4.5, 19, 0.5) },
  { food_name: 'Köfte (Izgara)', food_name_en: 'Grilled Turkish Meatball', tags: ['köfte', 'meatball', 'ızgara', 'beef', 'dana'], ...per100g(258, 20, 6.5, 18, 0.8) },
  { food_name: 'Köfte (Haşlanmış)', food_name_en: 'Boiled Turkish Meatball', tags: ['köfte', 'meatball', 'haşlanmış', 'boiled', 'beef'], ...per100g(218, 19, 6.0, 14, 0.8) },
  { food_name: 'Kuzu Pirzola (Izgara)', food_name_en: 'Lamb Chops Grilled', tags: ['kuzu', 'lamb', 'pirzola', 'chops', 'ızgara'], ...per100g(294, 25, 0, 21, 0) },
  { food_name: 'Kuzu Şiş', food_name_en: 'Lamb Shish', tags: ['kuzu', 'lamb', 'şiş', 'kebap', 'shish'], ...per100g(235, 26, 1.5, 14, 0) },
  { food_name: 'Kuzu Kıyma', food_name_en: 'Ground Lamb', tags: ['kuzu', 'lamb', 'kıyma', 'ground'], ...per100g(281, 16, 0, 24, 0) },
  { food_name: 'Dana Döner', food_name_en: 'Beef Doner Kebab', tags: ['döner', 'doner', 'kebap', 'beef', 'dana'], ...per100g(255, 22, 5.0, 17, 0.5) },
  { food_name: 'Sığır Biftek', food_name_en: 'Beef Steak', tags: ['biftek', 'steak', 'sığır', 'beef'], ...per100g(242, 27, 0, 15, 0) },
  { food_name: 'Dana Haşlama', food_name_en: 'Boiled Beef', tags: ['dana', 'beef', 'haşlama', 'boiled'], ...per100g(205, 28, 0, 10, 0) },
  { food_name: 'Dana Kavurma', food_name_en: 'Beef Kavurma', tags: ['dana', 'kavurma', 'beef', 'fried'], ...per100g(280, 25, 2.0, 19, 0) },
  { food_name: 'Pastırma', food_name_en: 'Pastirma Cured Beef', tags: ['pastırma', 'pastirma', 'cured', 'beef', 'dana'], ...per100g(260, 35, 2.0, 13, 0) },
  { food_name: 'Sucuk', food_name_en: 'Sujuk Turkish Sausage', tags: ['sucuk', 'sujuk', 'sausage'], ...per100g(400, 22, 2.0, 35, 0) },
  { food_name: 'Sosis', food_name_en: 'Sausage', tags: ['sosis', 'sausage'], ...per100g(296, 12, 4.0, 27, 0) },
  { food_name: 'Salam', food_name_en: 'Salami', tags: ['salam', 'salami'], ...per100g(340, 15, 2.0, 30, 0) },
  { food_name: 'Dana Ciğer (Kızarmış)', food_name_en: 'Fried Beef Liver', tags: ['ciğer', 'liver', 'dana', 'beef', 'kızarmış'], ...per100g(191, 24, 5.5, 8.0, 0) },
  { food_name: 'Kuzu İncik', food_name_en: 'Lamb Shank', tags: ['kuzu', 'lamb', 'incik', 'shank'], ...per100g(245, 26, 0, 16, 0) },
];

// ============================================================
// BAKLİYAT (gram bazlı - pişmiş hali)
// ============================================================
const legumes = [
  { food_name: 'Kırmızı Mercimek (Pişmiş)', food_name_en: 'Red Lentils Cooked', tags: ['mercimek', 'lentil', 'kırmızı', 'red', 'pişmiş', 'cooked', 'bakliyat', 'legume'], ...per100g(116, 9.0, 20, 0.4, 7.9) },
  { food_name: 'Yeşil Mercimek (Pişmiş)', food_name_en: 'Green Lentils Cooked', tags: ['mercimek', 'lentil', 'yeşil', 'green', 'pişmiş', 'bakliyat'], ...per100g(116, 9.0, 20, 0.4, 7.9) },
  { food_name: 'Nohut (Pişmiş)', food_name_en: 'Chickpeas Cooked', tags: ['nohut', 'chickpea', 'pişmiş', 'cooked', 'bakliyat', 'legume'], ...per100g(164, 8.9, 27, 2.6, 7.6) },
  { food_name: 'Kuru Fasulye (Pişmiş)', food_name_en: 'White Beans Cooked', tags: ['fasulye', 'bean', 'kuru', 'white', 'pişmiş', 'bakliyat'], ...per100g(127, 8.7, 22, 0.5, 6.3) },
  { food_name: 'Barbunya (Pişmiş)', food_name_en: 'Kidney Beans Cooked', tags: ['barbunya', 'kidney bean', 'pişmiş', 'bakliyat'], ...per100g(127, 8.7, 22.8, 0.5, 6.3) },
  { food_name: 'Börülce (Pişmiş)', food_name_en: 'Black-Eyed Peas Cooked', tags: ['börülce', 'black-eyed pea', 'pişmiş', 'bakliyat'], ...per100g(116, 7.9, 20.8, 0.6, 6.5) },
  { food_name: 'Soya Fasulyesi (Pişmiş)', food_name_en: 'Soybeans Cooked', tags: ['soya', 'soybean', 'pişmiş', 'bakliyat', 'protein'], ...per100g(173, 17, 10, 9.0, 6.0) },
  { food_name: 'Bezelye (Pişmiş)', food_name_en: 'Green Peas Cooked', tags: ['bezelye', 'pea', 'pişmiş', 'green'], ...per100g(84, 5.4, 15, 0.2, 5.5) },
  { food_name: 'Edamame', food_name_en: 'Edamame', tags: ['edamame', 'soya', 'soybean', 'protein'], ...per100g(122, 11, 9.9, 5.2, 5.2) },
  { food_name: 'Hummus', food_name_en: 'Hummus', tags: ['hummus', 'nohut', 'chickpea', 'tahin', 'tahini'], ...per100g(166, 7.9, 14, 9.6, 6.0) },
  { food_name: 'Mercimek Köftesi', food_name_en: 'Lentil Kofte', tags: ['mercimek köftesi', 'lentil kofte', 'mercimek', 'köfte'], ...per100g(190, 8.5, 30, 4.5, 4.5) },
  { food_name: 'Falafel', food_name_en: 'Falafel', tags: ['falafel', 'nohut', 'chickpea', 'fried'], ...per100g(333, 13, 32, 18, 6.8) },
  { food_name: 'Siyah Fasulye (Pişmiş)', food_name_en: 'Black Beans Cooked', tags: ['siyah fasulye', 'black bean', 'pişmiş', 'bakliyat'], ...per100g(132, 8.9, 24, 0.5, 8.7) },
  { food_name: 'Pinto Fasulye (Pişmiş)', food_name_en: 'Pinto Beans Cooked', tags: ['pinto fasulye', 'pinto bean', 'pişmiş', 'bakliyat'], ...per100g(143, 9.0, 26, 0.7, 9.0) },
];

// ============================================================
// PİRİNÇ VE TAHILLAR
// ============================================================
const grains = [
  { food_name: 'Beyaz Pirinç (Pişmiş)', food_name_en: 'White Rice Cooked', tags: ['pirinç', 'rice', 'beyaz', 'white', 'pişmiş', 'cooked'], ...per100g(130, 2.7, 28, 0.3, 0.4) },
  { food_name: 'Esmer Pirinç (Pişmiş)', food_name_en: 'Brown Rice Cooked', tags: ['pirinç', 'rice', 'esmer', 'brown', 'pişmiş', 'cooked'], ...per100g(123, 2.6, 26, 0.9, 1.8) },
  { food_name: 'Bulgur (Pişmiş)', food_name_en: 'Bulgur Cooked', tags: ['bulgur', 'pişmiş', 'cooked', 'tahıl', 'grain'], ...per100g(83, 3.1, 18.6, 0.2, 4.5) },
  { food_name: 'Makarna (Pişmiş)', food_name_en: 'Pasta Cooked', tags: ['makarna', 'pasta', 'pişmiş', 'cooked'], ...per100g(131, 5.0, 25, 1.1, 1.8) },
  { food_name: 'Tam Buğday Makarnası (Pişmiş)', food_name_en: 'Whole Wheat Pasta Cooked', tags: ['makarna', 'pasta', 'tam buğday', 'whole wheat', 'pişmiş'], ...per100g(124, 5.3, 26, 0.5, 3.2) },
  { food_name: 'Yulaf (Pişmiş)', food_name_en: 'Oats Cooked', tags: ['yulaf', 'oat', 'pişmiş', 'cooked', 'oatmeal'], ...per100g(71, 2.5, 12, 1.5, 1.7) },
  { food_name: 'Yulaf Ezmesi (Ham)', food_name_en: 'Raw Oats', tags: ['yulaf', 'oat', 'ham', 'raw', 'ezmesi', 'oatmeal'], ...per100g(379, 13.2, 68, 6.5, 10.6) },
  { food_name: 'Kuskus (Pişmiş)', food_name_en: 'Couscous Cooked', tags: ['kuskus', 'couscous', 'pişmiş', 'cooked'], ...per100g(112, 3.8, 23.2, 0.2, 1.4) },
  { food_name: 'Kinoa (Pişmiş)', food_name_en: 'Quinoa Cooked', tags: ['kinoa', 'quinoa', 'pişmiş', 'cooked', 'protein'], ...per100g(120, 4.4, 21.3, 1.9, 2.8) },
  { food_name: 'Arpa (Pişmiş)', food_name_en: 'Barley Cooked', tags: ['arpa', 'barley', 'pişmiş', 'cooked'], ...per100g(123, 2.3, 28.2, 0.4, 6.0) },
  { food_name: 'Buğday Kepeği', food_name_en: 'Wheat Bran', tags: ['kepek', 'bran', 'buğday', 'wheat', 'fiber'], ...per100g(216, 15.5, 64.5, 4.3, 42.8) },
];

// ============================================================
// EKMEK VE HAMUR İŞLERİ
// ============================================================
const bread = [
  { food_name: 'Beyaz Ekmek', food_name_en: 'White Bread', tags: ['ekmek', 'bread', 'beyaz', 'white'], ...per100g(265, 9.0, 49, 3.2, 2.7) },
  { food_name: 'Tam Buğday Ekmeği', food_name_en: 'Whole Wheat Bread', tags: ['ekmek', 'bread', 'tam buğday', 'whole wheat', 'esmer'], ...per100g(247, 10.7, 44.3, 3.4, 7.4) },
  { food_name: 'Çavdar Ekmeği', food_name_en: 'Rye Bread', tags: ['ekmek', 'bread', 'çavdar', 'rye'], ...per100g(259, 8.5, 48.3, 3.3, 5.8) },
  { food_name: 'Pide (Sade)', food_name_en: 'Turkish Pita Plain', tags: ['pide', 'pita', 'sade', 'plain', 'bread'], ...per100g(275, 9.0, 52, 4.0, 2.5) },
  { food_name: 'Lavaş', food_name_en: 'Lavash Flatbread', tags: ['lavaş', 'lavash', 'flatbread', 'bread'], ...per100g(277, 9.5, 54, 2.8, 2.4) },
  { food_name: 'Simit', food_name_en: 'Simit Turkish Sesame Bagel', tags: ['simit', 'sesame', 'bagel', 'bread', 'turkish'], ...per100g(295, 9.8, 53, 4.5, 3.2) },
  { food_name: 'Bazlama', food_name_en: 'Bazlama Turkish Flatbread', tags: ['bazlama', 'flatbread', 'bread', 'turkish'], ...per100g(275, 8.8, 50, 4.5, 2.2) },
  { food_name: 'Sandviç Ekmeği (Kepekli)', food_name_en: 'Sandwich Bread Whole Grain', tags: ['sandviç', 'sandwich', 'ekmek', 'bread', 'kepekli', 'whole grain'], ...per100g(255, 10, 46, 3.5, 6.5) },
  { food_name: 'Tortilla', food_name_en: 'Flour Tortilla', tags: ['tortilla', 'wrap', 'bread', 'dürüm'], ...per100g(306, 8.2, 51, 7.3, 3.2) },
  { food_name: 'Galeta', food_name_en: 'Rusks Crackers', tags: ['galeta', 'cracker', 'rusk', 'bisküvi'], ...per100g(382, 9.5, 74, 6.0, 3.2) },
];

// ============================================================
// SÜTLÜ ÜRÜNLER
// ============================================================
const dairy = [
  { food_name: 'Tam Yağlı Süt', food_name_en: 'Whole Milk', tags: ['süt', 'milk', 'tam yağlı', 'whole', 'dairy'], ...per100g(61, 3.2, 4.8, 3.3, 0) },
  { food_name: 'Yağsız Süt', food_name_en: 'Skim Milk', tags: ['süt', 'milk', 'yağsız', 'skim', 'dairy'], ...per100g(34, 3.4, 5.0, 0.1, 0) },
  { food_name: 'Yoğurt (Tam Yağlı)', food_name_en: 'Yogurt Whole Milk', tags: ['yoğurt', 'yogurt', 'tam yağlı', 'whole', 'dairy'], ...per100g(61, 3.5, 4.7, 3.3, 0) },
  { food_name: 'Yoğurt (Light)', food_name_en: 'Low-Fat Yogurt', tags: ['yoğurt', 'yogurt', 'light', 'yağsız', 'dairy'], ...per100g(40, 4.2, 5.0, 0.4, 0) },
  { food_name: 'Süzme Yoğurt', food_name_en: 'Strained Yogurt', tags: ['süzme', 'yoğurt', 'strained yogurt', 'greek', 'dairy'], ...per100g(97, 9.0, 3.6, 5.0, 0) },
  { food_name: 'Yunan Yoğurdu', food_name_en: 'Greek Yogurt', tags: ['yunan', 'greek', 'yoğurt', 'yogurt', 'protein', 'dairy'], ...per100g(73, 10, 3.6, 0.4, 0) },
  { food_name: 'Kaymak', food_name_en: 'Clotted Cream Kaymak', tags: ['kaymak', 'cream', 'dairy', 'clotted'], ...per100g(338, 2.6, 3.7, 35, 0) },
  { food_name: 'Krema', food_name_en: 'Heavy Cream', tags: ['krema', 'cream', 'heavy', 'dairy'], ...per100g(292, 2.1, 3.8, 30, 0) },
  { food_name: 'Beyaz Peynir', food_name_en: 'White Feta Cheese', tags: ['peynir', 'beyaz', 'feta', 'cheese', 'dairy'], ...per100g(264, 14, 2.0, 22, 0) },
  { food_name: 'Kaşar Peyniri', food_name_en: 'Kashar Cheese', tags: ['peynir', 'kaşar', 'kashar', 'cheese', 'dairy'], ...per100g(389, 26, 1.0, 31, 0) },
  { food_name: 'Tulum Peyniri', food_name_en: 'Tulum Cheese', tags: ['peynir', 'tulum', 'cheese', 'dairy'], ...per100g(347, 22, 1.0, 29, 0) },
  { food_name: 'Lor Peyniri', food_name_en: 'Lor Cheese', tags: ['peynir', 'lor', 'ricotta', 'cheese', 'dairy'], ...per100g(98, 8.5, 3.0, 6.0, 0) },
  { food_name: 'Çökelek', food_name_en: 'Turkish Curd Cheese', tags: ['çökelek', 'curd', 'cheese', 'dairy'], ...per100g(105, 9.5, 2.0, 6.5, 0) },
  { food_name: 'Mozzarella Peyniri', food_name_en: 'Mozzarella Cheese', tags: ['mozzarella', 'peynir', 'cheese', 'dairy', 'italian'], ...per100g(280, 17, 2.2, 22, 0) },
  { food_name: 'Cheddar Peyniri', food_name_en: 'Cheddar Cheese', tags: ['cheddar', 'peynir', 'cheese', 'dairy'], ...per100g(403, 25, 1.3, 33, 0) },
  { food_name: 'Parmesan Peyniri', food_name_en: 'Parmesan Cheese', tags: ['parmesan', 'peynir', 'cheese', 'dairy', 'italian'], ...per100g(431, 38, 4.1, 29, 0) },
  { food_name: 'Tereyağı', food_name_en: 'Butter', tags: ['tereyağı', 'butter', 'yağ', 'fat', 'dairy'], ...per100g(717, 0.9, 0.1, 81, 0) },
  { food_name: 'Kefir', food_name_en: 'Kefir', tags: ['kefir', 'dairy', 'probiotic', 'fermented'], ...per100g(41, 3.3, 4.5, 1.0, 0) },
  { food_name: 'Ayran', food_name_en: 'Ayran Yogurt Drink', tags: ['ayran', 'yogurt drink', 'dairy', 'turkish'], ...per100g(30, 1.6, 2.4, 1.5, 0) },
];

// ============================================================
// YUMURTA
// ============================================================
const eggs = [
  { food_name: 'Yumurta (Haşlanmış)', food_name_en: 'Boiled Egg', tags: ['yumurta', 'egg', 'haşlanmış', 'boiled'], unit_type: 'adet', ...perUnit(78, 6.3, 0.6, 5.3, 0) },
  { food_name: 'Yumurta (Sahanda)', food_name_en: 'Fried Egg', tags: ['yumurta', 'egg', 'sahanda', 'fried'], unit_type: 'adet', ...perUnit(90, 6.3, 0.4, 7.0, 0) },
  { food_name: 'Scrambled Eggs', food_name_en: 'Scrambled Eggs', tags: ['yumurta', 'egg', 'scrambled'], ...per100g(149, 9.7, 1.6, 11.5, 0) },
  { food_name: 'Menemen', food_name_en: 'Turkish Eggs Menemen', tags: ['menemen', 'yumurta', 'egg', 'domates', 'tomato', 'turkish'], ...per100g(108, 5.0, 4.5, 7.5, 0.8) },
];

// ============================================================
// SEBZELER (gram bazlı, çiğ)
// ============================================================
const vegetables = [
  { food_name: 'Domates', food_name_en: 'Tomato', tags: ['domates', 'tomato', 'sebze', 'vegetable'], ...per100g(18, 0.9, 3.9, 0.2, 1.2) },
  { food_name: 'Salatalık', food_name_en: 'Cucumber', tags: ['salatalık', 'cucumber', 'sebze', 'vegetable'], ...per100g(15, 0.7, 3.6, 0.1, 0.5) },
  { food_name: 'Yeşil Biber', food_name_en: 'Green Bell Pepper', tags: ['biber', 'pepper', 'yeşil', 'green', 'sebze'], ...per100g(20, 0.9, 4.6, 0.2, 1.7) },
  { food_name: 'Kırmızı Biber', food_name_en: 'Red Bell Pepper', tags: ['biber', 'pepper', 'kırmızı', 'red', 'sebze'], ...per100g(31, 1.0, 6.0, 0.3, 2.1) },
  { food_name: 'Soğan', food_name_en: 'Onion', tags: ['soğan', 'onion', 'kuru', 'dry', 'sebze'], ...per100g(40, 1.1, 9.3, 0.1, 1.7) },
  { food_name: 'Sarımsak', food_name_en: 'Garlic', tags: ['sarımsak', 'garlic', 'sebze'], ...per100g(149, 6.4, 33, 0.5, 2.1) },
  { food_name: 'Havuç', food_name_en: 'Carrot', tags: ['havuç', 'carrot', 'sebze', 'vegetable'], ...per100g(41, 0.9, 9.6, 0.2, 2.8) },
  { food_name: 'Patates (Pişmiş)', food_name_en: 'Boiled Potato', tags: ['patates', 'potato', 'pişmiş', 'boiled', 'sebze'], ...per100g(87, 1.9, 20, 0.1, 1.8) },
  { food_name: 'Tatlı Patates (Pişmiş)', food_name_en: 'Sweet Potato Cooked', tags: ['tatlı patates', 'sweet potato', 'pişmiş', 'sebze'], ...per100g(86, 1.6, 20, 0.1, 3.3) },
  { food_name: 'Patlıcan', food_name_en: 'Eggplant', tags: ['patlıcan', 'eggplant', 'aubergine', 'sebze'], ...per100g(25, 1.0, 5.9, 0.2, 3.0) },
  { food_name: 'Kabak', food_name_en: 'Zucchini', tags: ['kabak', 'zucchini', 'courgette', 'sebze', 'vegetable'], ...per100g(17, 1.2, 3.1, 0.3, 1.0) },
  { food_name: 'Ispanak', food_name_en: 'Spinach', tags: ['ıspanak', 'spinach', 'yeşil yapraklı', 'sebze'], ...per100g(23, 2.9, 3.6, 0.4, 2.2) },
  { food_name: 'Brokoli', food_name_en: 'Broccoli', tags: ['brokoli', 'broccoli', 'sebze', 'vegetable'], ...per100g(34, 2.8, 6.6, 0.4, 2.6) },
  { food_name: 'Karnabahar', food_name_en: 'Cauliflower', tags: ['karnabahar', 'cauliflower', 'sebze'], ...per100g(25, 2.0, 5.0, 0.3, 2.0) },
  { food_name: 'Beyaz Lahana', food_name_en: 'White Cabbage', tags: ['lahana', 'cabbage', 'beyaz', 'white', 'sebze'], ...per100g(25, 1.3, 5.8, 0.1, 2.5) },
  { food_name: 'Kırmızı Lahana', food_name_en: 'Red Cabbage', tags: ['lahana', 'cabbage', 'kırmızı', 'red', 'sebze'], ...per100g(31, 1.4, 7.4, 0.2, 2.1) },
  { food_name: 'Marul', food_name_en: 'Lettuce', tags: ['marul', 'lettuce', 'salata', 'sebze'], ...per100g(15, 1.4, 2.9, 0.2, 1.3) },
  { food_name: 'Roka', food_name_en: 'Arugula', tags: ['roka', 'arugula', 'rocket', 'salata', 'sebze'], ...per100g(25, 2.6, 3.7, 0.7, 1.6) },
  { food_name: 'Taze Soğan', food_name_en: 'Spring Onion', tags: ['taze soğan', 'spring onion', 'yeşil soğan', 'sebze'], ...per100g(32, 1.8, 7.3, 0.2, 2.6) },
  { food_name: 'Mantar', food_name_en: 'White Mushroom', tags: ['mantar', 'mushroom', 'kültür', 'white', 'sebze'], ...per100g(22, 3.1, 3.3, 0.3, 1.0) },
  { food_name: 'Kuşkonmaz', food_name_en: 'Asparagus', tags: ['kuşkonmaz', 'asparagus', 'sebze'], ...per100g(20, 2.2, 3.9, 0.2, 2.1) },
  { food_name: 'Kereviz', food_name_en: 'Celery', tags: ['kereviz', 'celery', 'sebze'], ...per100g(16, 0.7, 3.0, 0.2, 1.6) },
  { food_name: 'Turp', food_name_en: 'Radish', tags: ['turp', 'radish', 'sebze'], ...per100g(16, 0.7, 3.4, 0.1, 1.6) },
  { food_name: 'Maydanoz', food_name_en: 'Parsley', tags: ['maydanoz', 'parsley', 'ot', 'herb'], ...per100g(36, 3.0, 6.3, 0.8, 3.3) },
  { food_name: 'Nane', food_name_en: 'Mint', tags: ['nane', 'mint', 'ot', 'herb'], ...per100g(44, 3.3, 8.4, 0.7, 6.8) },
  { food_name: 'Dereotu', food_name_en: 'Dill', tags: ['dereotu', 'dill', 'ot', 'herb'], ...per100g(43, 3.5, 7.0, 1.1, 2.1) },
  { food_name: 'Zeytinyağı', food_name_en: 'Olive Oil', tags: ['zeytinyağı', 'olive oil', 'yağ', 'oil', 'fat'], ...per100g(884, 0, 0, 100, 0) },
  { food_name: 'Ayçiçek Yağı', food_name_en: 'Sunflower Oil', tags: ['ayçiçek yağı', 'sunflower oil', 'yağ', 'oil', 'fat'], ...per100g(884, 0, 0, 100, 0) },
  { food_name: 'Mısır', food_name_en: 'Corn', tags: ['mısır', 'corn', 'sebze', 'vegetable'], ...per100g(96, 3.4, 21, 1.5, 2.4) },
  { food_name: 'Pancar', food_name_en: 'Beetroot', tags: ['pancar', 'beetroot', 'beet', 'sebze'], ...per100g(43, 1.6, 9.6, 0.2, 2.8) },
  { food_name: 'Enginar', food_name_en: 'Artichoke', tags: ['enginar', 'artichoke', 'sebze'], ...per100g(47, 3.3, 10.5, 0.2, 5.4) },
  { food_name: 'Pırasa', food_name_en: 'Leek', tags: ['pırasa', 'leek', 'sebze'], ...per100g(61, 1.5, 14, 0.3, 1.8) },
];

// ============================================================
// MEYVELER
// ============================================================
const fruits = [
  { food_name: 'Elma', food_name_en: 'Apple', tags: ['elma', 'apple', 'meyve', 'fruit'], ...per100g(52, 0.3, 14, 0.2, 2.4) },
  { food_name: 'Armut', food_name_en: 'Pear', tags: ['armut', 'pear', 'meyve', 'fruit'], ...per100g(57, 0.4, 15, 0.1, 3.1) },
  { food_name: 'Muz', food_name_en: 'Banana', tags: ['muz', 'banana', 'meyve', 'fruit'], ...per100g(89, 1.1, 23, 0.3, 2.6) },
  { food_name: 'Portakal', food_name_en: 'Orange', tags: ['portakal', 'orange', 'meyve', 'fruit'], ...per100g(47, 0.9, 12, 0.1, 2.4) },
  { food_name: 'Mandalina', food_name_en: 'Tangerine', tags: ['mandalina', 'tangerine', 'mandarin', 'meyve', 'fruit'], ...per100g(53, 0.8, 13, 0.3, 1.8) },
  { food_name: 'Çilek', food_name_en: 'Strawberry', tags: ['çilek', 'strawberry', 'meyve', 'fruit'], ...per100g(32, 0.7, 7.7, 0.3, 2.0) },
  { food_name: 'Üzüm', food_name_en: 'Grapes', tags: ['üzüm', 'grape', 'meyve', 'fruit'], ...per100g(67, 0.6, 17, 0.4, 0.9) },
  { food_name: 'Karpuz', food_name_en: 'Watermelon', tags: ['karpuz', 'watermelon', 'meyve', 'fruit'], ...per100g(30, 0.6, 7.6, 0.2, 0.4) },
  { food_name: 'Kavun', food_name_en: 'Cantaloupe Melon', tags: ['kavun', 'melon', 'cantaloupe', 'meyve', 'fruit'], ...per100g(34, 0.8, 8.2, 0.2, 0.9) },
  { food_name: 'Şeftali', food_name_en: 'Peach', tags: ['şeftali', 'peach', 'meyve', 'fruit'], ...per100g(39, 0.9, 9.5, 0.3, 1.5) },
  { food_name: 'Kiraz', food_name_en: 'Cherry', tags: ['kiraz', 'cherry', 'meyve', 'fruit'], ...per100g(63, 1.1, 16, 0.2, 2.1) },
  { food_name: 'Vişne', food_name_en: 'Sour Cherry', tags: ['vişne', 'sour cherry', 'meyve', 'fruit'], ...per100g(50, 1.0, 12.2, 0.3, 1.6) },
  { food_name: 'Kivi', food_name_en: 'Kiwi', tags: ['kivi', 'kiwi', 'meyve', 'fruit'], ...per100g(61, 1.1, 15, 0.5, 3.0) },
  { food_name: 'Ananas', food_name_en: 'Pineapple', tags: ['ananas', 'pineapple', 'meyve', 'fruit'], ...per100g(50, 0.5, 13, 0.1, 1.4) },
  { food_name: 'Mango', food_name_en: 'Mango', tags: ['mango', 'meyve', 'fruit'], ...per100g(60, 0.8, 15, 0.4, 1.6) },
  { food_name: 'Avokado', food_name_en: 'Avocado', tags: ['avokado', 'avocado', 'meyve', 'fruit', 'yağ', 'fat'], ...per100g(160, 2.0, 9.0, 15, 6.7) },
  { food_name: 'İncir (Taze)', food_name_en: 'Fresh Fig', tags: ['incir', 'fig', 'taze', 'fresh', 'meyve', 'fruit'], ...per100g(74, 0.8, 19, 0.3, 2.9) },
  { food_name: 'Nar', food_name_en: 'Pomegranate', tags: ['nar', 'pomegranate', 'meyve', 'fruit'], ...per100g(83, 1.7, 19, 1.2, 4.0) },
  { food_name: 'Limon', food_name_en: 'Lemon', tags: ['limon', 'lemon', 'meyve', 'fruit', 'citrus'], ...per100g(29, 1.1, 9.3, 0.3, 2.8) },
  { food_name: 'Hurma', food_name_en: 'Date', tags: ['hurma', 'date', 'meyve', 'fruit', 'dried'], ...per100g(277, 1.8, 75, 0.2, 6.7) },
  { food_name: 'Kuru Üzüm', food_name_en: 'Raisin', tags: ['kuru üzüm', 'raisin', 'kuru meyve', 'dried', 'fruit'], ...per100g(299, 3.1, 79, 0.5, 3.7) },
  { food_name: 'Kuru Kayısı', food_name_en: 'Dried Apricot', tags: ['kayısı', 'apricot', 'kuru', 'dried', 'meyve', 'fruit'], ...per100g(241, 3.4, 62, 0.5, 7.3) },
  { food_name: 'Erik', food_name_en: 'Plum', tags: ['erik', 'plum', 'meyve', 'fruit'], ...per100g(46, 0.7, 11, 0.3, 1.4) },
  { food_name: 'Kayısı (Taze)', food_name_en: 'Fresh Apricot', tags: ['kayısı', 'apricot', 'taze', 'fresh', 'meyve', 'fruit'], ...per100g(48, 1.4, 11, 0.4, 2.0) },
  { food_name: 'Böğürtlen', food_name_en: 'Blackberry', tags: ['böğürtlen', 'blackberry', 'meyve', 'fruit'], ...per100g(43, 1.4, 9.6, 0.5, 5.3) },
  { food_name: 'Ahududu', food_name_en: 'Raspberry', tags: ['ahududu', 'raspberry', 'meyve', 'fruit'], ...per100g(52, 1.2, 11.9, 0.7, 6.5) },
  { food_name: 'Yaban Mersini', food_name_en: 'Blueberry', tags: ['yaban mersini', 'blueberry', 'meyve', 'fruit'], ...per100g(57, 0.7, 14.5, 0.3, 2.4) },
];

// ============================================================
// KURUYEMIŞLER VE TOHUMLAR
// ============================================================
const nuts = [
  { food_name: 'Badem', food_name_en: 'Almonds', tags: ['badem', 'almond', 'kuruyemiş', 'nut', 'seed'], ...per100g(579, 21, 22, 50, 12.5) },
  { food_name: 'Ceviz', food_name_en: 'Walnuts', tags: ['ceviz', 'walnut', 'kuruyemiş', 'nut'], ...per100g(654, 15, 14, 65, 6.7) },
  { food_name: 'Fındık', food_name_en: 'Hazelnuts', tags: ['fındık', 'hazelnut', 'kuruyemiş', 'nut'], ...per100g(628, 15, 17, 61, 9.7) },
  { food_name: 'Yer Fıstığı', food_name_en: 'Peanuts', tags: ['fıstık', 'yer fıstığı', 'peanut', 'kuruyemiş', 'nut'], ...per100g(567, 26, 16, 49, 8.5) },
  { food_name: 'Antep Fıstığı', food_name_en: 'Pistachios', tags: ['antep fıstığı', 'pistachio', 'kuruyemiş', 'nut'], ...per100g(562, 20, 28, 45, 10.6) },
  { food_name: 'Kaju', food_name_en: 'Cashews', tags: ['kaju', 'cashew', 'kuruyemiş', 'nut'], ...per100g(553, 18, 30, 44, 3.3) },
  { food_name: 'Çam Fıstığı', food_name_en: 'Pine Nuts', tags: ['çam fıstığı', 'pine nut', 'kuruyemiş'], ...per100g(673, 14, 13, 68, 3.7) },
  { food_name: 'Susam', food_name_en: 'Sesame Seeds', tags: ['susam', 'sesame', 'tohum', 'seed'], ...per100g(573, 17, 23, 50, 11.8) },
  { food_name: 'Kabak Çekirdeği', food_name_en: 'Pumpkin Seeds', tags: ['kabak çekirdeği', 'pumpkin seed', 'tohum', 'seed'], ...per100g(559, 30, 11, 49, 6.0) },
  { food_name: 'Ayçiçeği Çekirdeği', food_name_en: 'Sunflower Seeds', tags: ['ayçiçeği çekirdeği', 'sunflower seed', 'tohum', 'seed'], ...per100g(584, 21, 20, 51, 8.6) },
  { food_name: 'Chia Tohumu', food_name_en: 'Chia Seeds', tags: ['chia', 'tohum', 'seed', 'omega'], ...per100g(486, 17, 42, 31, 34.4) },
  { food_name: 'Keten Tohumu', food_name_en: 'Flaxseed', tags: ['keten tohumu', 'flaxseed', 'tohum', 'seed', 'omega'], ...per100g(534, 18, 29, 42, 27.3) },
  { food_name: 'Fıstık Ezmesi', food_name_en: 'Peanut Butter', tags: ['fıstık ezmesi', 'peanut butter', 'yer fıstığı', 'spread'], ...per100g(588, 25, 20, 50, 6.0) },
  { food_name: 'Badem Ezmesi', food_name_en: 'Almond Butter', tags: ['badem ezmesi', 'almond butter', 'badem', 'spread'], ...per100g(614, 21, 19, 56, 10.5) },
  { food_name: 'Tahin', food_name_en: 'Tahini', tags: ['tahin', 'tahini', 'susam', 'sesame', 'paste'], ...per100g(595, 17, 21, 53, 9.3) },
];

// ============================================================
// BALIK VE DENİZ ÜRÜNLERİ
// ============================================================
const fish = [
  { food_name: 'Somon (Izgara)', food_name_en: 'Grilled Salmon', tags: ['somon', 'salmon', 'balık', 'fish', 'ızgara', 'grilled'], ...per100g(208, 20, 0, 13, 0) },
  { food_name: 'Ton Balığı (Konserve, Suda)', food_name_en: 'Canned Tuna in Water', tags: ['ton', 'tuna', 'balık', 'fish', 'konserve', 'canned'], ...per100g(116, 26, 0, 1.0, 0) },
  { food_name: 'Ton Balığı (Konserve, Yağlı)', food_name_en: 'Canned Tuna in Oil', tags: ['ton', 'tuna', 'balık', 'fish', 'konserve', 'yağlı', 'canned'], ...per100g(198, 22, 0, 12, 0) },
  { food_name: 'Hamsi (Kızarmış)', food_name_en: 'Fried Anchovy', tags: ['hamsi', 'anchovy', 'balık', 'fish', 'kızarmış', 'fried'], ...per100g(195, 18, 7.5, 10, 0) },
  { food_name: 'Hamsi (Izgara)', food_name_en: 'Grilled Anchovy', tags: ['hamsi', 'anchovy', 'balık', 'fish', 'ızgara', 'grilled'], ...per100g(131, 18, 0, 7.0, 0) },
  { food_name: 'Levrek (Izgara)', food_name_en: 'Grilled Sea Bass', tags: ['levrek', 'sea bass', 'balık', 'fish', 'ızgara'], ...per100g(124, 19, 0, 5.2, 0) },
  { food_name: 'Çipura (Izgara)', food_name_en: 'Grilled Sea Bream', tags: ['çipura', 'sea bream', 'balık', 'fish', 'ızgara'], ...per100g(128, 19, 0, 5.5, 0) },
  { food_name: 'Uskumru', food_name_en: 'Mackerel', tags: ['uskumru', 'mackerel', 'balık', 'fish'], ...per100g(205, 19, 0, 14, 0) },
  { food_name: 'Sardalya (Konserve)', food_name_en: 'Canned Sardines', tags: ['sardalya', 'sardine', 'balık', 'fish', 'konserve'], ...per100g(208, 25, 0, 11, 0) },
  { food_name: 'Karides (Haşlanmış)', food_name_en: 'Boiled Shrimp', tags: ['karides', 'shrimp', 'prawn', 'deniz ürünü', 'seafood'], ...per100g(99, 24, 0, 0.3, 0) },
  { food_name: 'Ahtapot (Haşlanmış)', food_name_en: 'Boiled Octopus', tags: ['ahtapot', 'octopus', 'deniz ürünü', 'seafood'], ...per100g(82, 15, 2.2, 1.0, 0) },
  { food_name: 'Midye', food_name_en: 'Mussels', tags: ['midye', 'mussel', 'deniz ürünü', 'seafood'], ...per100g(86, 12, 3.7, 2.2, 0) },
  { food_name: 'Palamut (Izgara)', food_name_en: 'Grilled Atlantic Bonito', tags: ['palamut', 'bonito', 'balık', 'fish', 'ızgara'], ...per100g(162, 21, 0, 8.5, 0) },
  { food_name: 'Kalkan Balığı (Izgara)', food_name_en: 'Grilled Turbot', tags: ['kalkan', 'turbot', 'balık', 'fish', 'ızgara'], ...per100g(111, 17, 0, 4.5, 0) },
];

// ============================================================
// TÜRK YEMEKLERİ (gram bazlı, pişmiş hali)
// ============================================================
const turkishFoods = [
  { food_name: 'İmam Bayıldı', food_name_en: 'Imam Bayildi Stuffed Eggplant', tags: ['imam bayıldı', 'patlıcan', 'eggplant', 'türk yemeği'], ...per100g(120, 2.0, 7.5, 9.5, 2.5) },
  { food_name: 'Karnıyarık', food_name_en: 'Karniyarik Stuffed Eggplant with Meat', tags: ['karnıyarık', 'patlıcan', 'kıyma', 'türk yemeği'], ...per100g(150, 6.5, 7.0, 11, 2.2) },
  { food_name: 'Kuru Fasulye Yemeği', food_name_en: 'Turkish White Bean Stew', tags: ['kuru fasulye', 'bean stew', 'türk yemeği'], ...per100g(120, 7.5, 18, 2.5, 4.5) },
  { food_name: 'Nohutlu Pilav', food_name_en: 'Chickpea Rice Pilaf', tags: ['nohutlu pilav', 'nohut', 'pirinç', 'chickpea', 'rice', 'pilav'], ...per100g(148, 4.5, 27, 2.5, 2.2) },
  { food_name: 'İç Pilav', food_name_en: 'Turkish Stuffed Rice Pilaf', tags: ['iç pilav', 'pilav', 'rice', 'türk yemeği'], ...per100g(165, 3.5, 26, 6.0, 1.5) },
  { food_name: 'Zeytinyağlı Taze Fasulye', food_name_en: 'Green Beans in Olive Oil', tags: ['zeytinyağlı fasulye', 'green bean', 'olive oil', 'türk yemeği'], ...per100g(72, 1.8, 5.5, 5.0, 2.0) },
  { food_name: 'Kısır', food_name_en: 'Kisir Turkish Bulgur Salad', tags: ['kısır', 'bulgur', 'salata', 'türk yemeği'], ...per100g(130, 3.5, 22, 3.5, 3.0) },
  { food_name: 'Cacık', food_name_en: 'Cacik Yogurt Cucumber Dip', tags: ['cacık', 'yoğurt', 'salatalık', 'yogurt', 'cucumber'], ...per100g(40, 2.5, 2.8, 1.8, 0.4) },
  { food_name: 'Haydari', food_name_en: 'Haydari Yogurt Dip', tags: ['haydari', 'yoğurt', 'sarımsak', 'yogurt', 'garlic', 'meze'], ...per100g(95, 7.0, 3.5, 6.0, 0.2) },
  { food_name: 'Patlıcan Salatası', food_name_en: 'Roasted Eggplant Salad', tags: ['patlıcan salatası', 'eggplant', 'közlenmiş', 'meze', 'salata'], ...per100g(68, 1.5, 5.5, 4.5, 2.0) },
  { food_name: 'Zeytinyağlı Yaprak Sarması', food_name_en: 'Stuffed Vine Leaves with Olive Oil', tags: ['dolma', 'yaprak', 'vine leaf', 'zeytinyağlı', 'olive oil', 'türk yemeği'], ...per100g(155, 2.5, 22, 6.5, 2.5) },
  { food_name: 'Etli Biber Dolması', food_name_en: 'Stuffed Bell Peppers with Meat', tags: ['biber dolması', 'biber', 'pepper', 'dolma', 'etli', 'türk yemeği'], ...per100g(148, 7.5, 14, 7.0, 1.8) },
  { food_name: 'Et Güveç', food_name_en: 'Turkish Meat Casserole', tags: ['güveç', 'casserole', 'et', 'sebze', 'türk yemeği'], ...per100g(140, 9.5, 8.5, 7.5, 2.0) },
  { food_name: 'Çoban Salatası', food_name_en: 'Shepherd Salad', tags: ['çoban salatası', 'domates', 'salatalık', 'salata', 'shepherd', 'turkish'], ...per100g(38, 1.0, 5.5, 1.5, 1.5) },
  { food_name: 'Sütlaç', food_name_en: 'Turkish Rice Pudding', tags: ['sütlaç', 'rice pudding', 'tatlı', 'dessert', 'milk'], ...per100g(122, 3.5, 20, 3.2, 0.2) },
  { food_name: 'Aşure', food_name_en: 'Ashure Noah Pudding', tags: ['aşure', 'ashure', 'tatlı', 'dessert', 'türk yemeği'], ...per100g(140, 4.0, 28, 1.5, 3.5) },
  { food_name: 'Muhallebi', food_name_en: 'Turkish Milk Pudding', tags: ['muhallebi', 'pudding', 'tatlı', 'dessert', 'milk'], ...per100g(105, 3.5, 20, 1.5, 0.1) },
  { food_name: 'Baklava', food_name_en: 'Baklava Slice', tags: ['baklava', 'tatlı', 'dessert', 'pastry'], unit_type: 'adet', ...perUnit(330, 5.0, 38, 18, 1.5) },
  { food_name: 'Lahmacun', food_name_en: 'Lahmacun Turkish Pizza', tags: ['lahmacun', 'kıyma', 'turkish pizza', 'türk yemeği'], ...per100g(230, 9.5, 32, 7.0, 2.0) },
  { food_name: 'Gözleme (Peynirli)', food_name_en: 'Gozleme with Cheese', tags: ['gözleme', 'peynir', 'cheese', 'türk yemeği', 'turkish'], ...per100g(246, 9.5, 28, 11, 1.8) },
  { food_name: 'Gözleme (Ispanaklı)', food_name_en: 'Gozleme with Spinach', tags: ['gözleme', 'ıspanak', 'spinach', 'türk yemeği'], ...per100g(210, 7.5, 28, 8.0, 2.5) },
  { food_name: 'Etli Nohut', food_name_en: 'Chickpea with Meat Stew', tags: ['nohut', 'et', 'chickpea', 'meat', 'türk yemeği'], ...per100g(165, 11, 18, 5.5, 4.0) },
  { food_name: 'Sulu Köfte', food_name_en: 'Turkish Meatball Stew', tags: ['sulu köfte', 'köfte', 'stew', 'türk yemeği'], ...per100g(130, 9.0, 10, 6.0, 1.2) },
  { food_name: 'Hünkar Beğendi', food_name_en: 'Hunkar Begendi Lamb with Eggplant Puree', tags: ['hünkar beğendi', 'patlıcan', 'kuzu', 'türk yemeği'], ...per100g(175, 11, 9.0, 11, 1.5) },
  { food_name: 'İskender Kebap', food_name_en: 'Iskender Kebab', tags: ['iskender', 'kebap', 'döner', 'türk yemeği'], ...per100g(245, 16, 18, 13, 1.0) },
];

// ============================================================
// İÇECEKLER
// ============================================================
const drinks = [
  { food_name: 'Su', food_name_en: 'Water', tags: ['su', 'water', 'içecek', 'drink'], ...per100g(0, 0, 0, 0, 0) },
  { food_name: 'Sade Çay', food_name_en: 'Black Tea Plain', tags: ['çay', 'tea', 'black tea', 'içecek', 'drink'], ...per100g(1, 0.1, 0.2, 0, 0) },
  { food_name: 'Filtre Kahve (Sade)', food_name_en: 'Filter Coffee Black', tags: ['kahve', 'coffee', 'filtre', 'siyah', 'black', 'içecek'], ...per100g(2, 0.3, 0.3, 0.1, 0) },
  { food_name: 'Türk Kahvesi (Sade)', food_name_en: 'Turkish Coffee Plain', tags: ['türk kahvesi', 'turkish coffee', 'kahve', 'içecek'], ...per100g(2, 0.3, 0.3, 0.1, 0) },
  { food_name: 'Sütlü Kahve', food_name_en: 'Latte Coffee with Milk', tags: ['latte', 'kahve', 'coffee', 'sütlü', 'milk', 'içecek'], ...per100g(50, 2.5, 5.0, 2.2, 0) },
  { food_name: 'Portakal Suyu (Taze)', food_name_en: 'Fresh Squeezed Orange Juice', tags: ['portakal suyu', 'orange juice', 'meyve suyu', 'juice', 'içecek'], ...per100g(45, 0.7, 10.4, 0.2, 0.2) },
  { food_name: 'Elma Suyu', food_name_en: 'Apple Juice', tags: ['elma suyu', 'apple juice', 'meyve suyu', 'juice', 'içecek'], ...per100g(46, 0.1, 11.4, 0.1, 0.2) },
  { food_name: 'Kola', food_name_en: 'Cola Soft Drink', tags: ['kola', 'cola', 'gazlı içecek', 'soft drink', 'içecek'], ...per100g(41, 0, 10.6, 0, 0) },
  { food_name: 'Limonata', food_name_en: 'Lemonade', tags: ['limonata', 'lemonade', 'limon', 'lemon', 'içecek', 'drink'], ...per100g(26, 0.1, 6.8, 0, 0.1) },
  { food_name: 'Ayran', food_name_en: 'Ayran Yogurt Drink', tags: ['ayran', 'yogurt drink', 'dairy', 'turkish', 'içecek'], ...per100g(30, 1.6, 2.4, 1.5, 0) },
  { food_name: 'Şalgam Suyu', food_name_en: 'Shalgam Turkish Turnip Juice', tags: ['şalgam', 'turnip juice', 'içecek', 'drink', 'türk'], ...per100g(15, 0.5, 3.0, 0.1, 0.8) },
  { food_name: 'Nar Suyu', food_name_en: 'Pomegranate Juice', tags: ['nar suyu', 'pomegranate juice', 'meyve suyu', 'juice', 'içecek'], ...per100g(54, 0.2, 13.3, 0.3, 0.3) },
];

// ============================================================
// KAHVALTILIK VE ATIŞTIRIMLIK
// ============================================================
const snacks = [
  { food_name: 'Granola', food_name_en: 'Granola', tags: ['granola', 'kahvaltı', 'breakfast', 'oat', 'yulaf'], ...per100g(471, 10.6, 64, 20, 6.5) },
  { food_name: 'Müsli', food_name_en: 'Muesli', tags: ['müsli', 'muesli', 'kahvaltı', 'breakfast', 'oat', 'yulaf'], ...per100g(378, 11, 73, 7.5, 7.0) },
  { food_name: 'Corn Flakes', food_name_en: 'Corn Flakes Cereal', tags: ['corn flakes', 'mısır gevreği', 'cereal', 'kahvaltı', 'breakfast'], ...per100g(378, 7.5, 84, 0.9, 3.0) },
  { food_name: 'Bal', food_name_en: 'Honey', tags: ['bal', 'honey', 'kahvaltı', 'sweetener'], ...per100g(304, 0.3, 82, 0, 0.2) },
  { food_name: 'Pekmez', food_name_en: 'Grape Molasses', tags: ['pekmez', 'grape molasses', 'üzüm', 'grape', 'sweetener'], ...per100g(280, 2.0, 68, 0.5, 0.8) },
  { food_name: 'Çilek Reçeli', food_name_en: 'Strawberry Jam', tags: ['reçel', 'jam', 'çilek', 'strawberry', 'kahvaltı'], ...per100g(250, 0.4, 65, 0.1, 0.7) },
  { food_name: 'Nutella', food_name_en: 'Nutella Hazelnut Spread', tags: ['nutella', 'fındık', 'hazelnut', 'chocolate', 'spread', 'kahvaltı'], ...per100g(541, 6.3, 57, 31, 3.4) },
  { food_name: 'Sütlü Çikolata', food_name_en: 'Milk Chocolate', tags: ['çikolata', 'chocolate', 'sütlü', 'milk', 'tatlı'], ...per100g(535, 7.7, 59, 30, 1.5) },
  { food_name: 'Bitter Çikolata', food_name_en: 'Dark Chocolate', tags: ['çikolata', 'chocolate', 'bitter', 'dark', 'tatlı'], ...per100g(598, 7.8, 46, 43, 11) },
  { food_name: 'Kraker (Tuzlu)', food_name_en: 'Salted Crackers', tags: ['kraker', 'cracker', 'tuzlu', 'salted', 'atıştırma'], ...per100g(421, 8.0, 70, 12, 2.5) },
  { food_name: 'Patates Kızartması', food_name_en: 'French Fries', tags: ['patates kızartması', 'french fries', 'fast food', 'fried'], ...per100g(312, 3.4, 41, 15, 3.5) },
  { food_name: 'Patates Cipsi', food_name_en: 'Potato Chips', tags: ['cips', 'chips', 'patates', 'potato', 'atıştırma', 'snack'], ...per100g(536, 7.0, 53, 35, 4.8) },
  { food_name: 'Popcorn', food_name_en: 'Air Popped Popcorn', tags: ['popcorn', 'mısır', 'corn', 'atıştırma', 'snack'], ...per100g(375, 12.9, 74, 4.3, 15.1) },
];

// ============================================================
// PROTEIN KAYNAKLARI
// ============================================================
const protein = [
  { food_name: 'Whey Protein Tozu', food_name_en: 'Whey Protein Powder', tags: ['whey', 'protein tozu', 'protein powder', 'supplement'], ...per100g(370, 80, 10, 5.0, 0) },
  { food_name: 'Tofu', food_name_en: 'Tofu', tags: ['tofu', 'soya', 'soy', 'protein', 'vegan'], ...per100g(76, 8.1, 1.9, 4.8, 0.3) },
  { food_name: 'Tempeh', food_name_en: 'Tempeh', tags: ['tempeh', 'soya', 'fermented', 'protein', 'vegan'], ...per100g(193, 19, 9.4, 11, 0) },
];

// ============================================================
// TÜM VERİYİ BİRLEŞTİR
// ============================================================
function buildDoc(item) {
  const { calories, protein_g, carbs_g, fat_g, fiber_g, tags, unit_type: ut, ...rest } = item;
  return {
    food_name: rest.food_name,
    food_name_en: rest.food_name_en,
    unit_type: ut || 'gram',
    per_unit: { calories, protein_g, carbs_g, fat_g, fiber_g: fiber_g || 0 },
    brand_name: null,
    source: 'seed',
    ai_provider: null,
    nutrition_basis: (ut || 'gram') === 'gram' ? 'per_gram' : 'per_unit',
    search_tags: tags,
    generated_at: now,
    created_at: now,
    updated_at: now,
  };
}

const allFoods = [
  ...soups, ...chicken, ...meat, ...legumes,
  ...grains, ...bread, ...dairy, ...eggs,
  ...vegetables, ...fruits, ...nuts, ...fish,
  ...turkishFoods, ...snacks, ...drinks, ...protein,
].map(buildDoc);

// ============================================================
// VERİTABANINA YAZMA
// ============================================================
async function main() {
  console.log(`\n🌱 Toplam ${allFoods.length} besin kaydı yükleniyor...\n`);
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('✅ MongoDB bağlantısı kuruldu.');
    const db = client.db(DB_NAME);
    const col = db.collection('foodcaches');

    // Metin indexi var mı kontrol et
    const indexes = await col.indexes();
    const hasTextIndex = indexes.some(idx => idx.name && idx.name.includes('text'));
    if (!hasTextIndex) {
      await col.createIndex(
        { food_name: 'text', food_name_en: 'text', search_tags: 'text' },
        { name: 'text_search_index' }
      );
      console.log('📑 Metin indeksi oluşturuldu.');
    }

    let inserted = 0;
    let skipped = 0;

    for (const doc of allFoods) {
      try {
        const result = await col.updateOne(
          { food_name: doc.food_name, brand_name: null },
          { $setOnInsert: doc },
          { upsert: true }
        );
        if (result.upsertedCount > 0) inserted++;
        else skipped++;
      } catch (err) {
        if (err.code === 11000) {
          skipped++;
        } else {
          console.error(`❌ Hata: ${doc.food_name}`, err.message);
        }
      }
    }

    console.log(`\n✅ Eklenen: ${inserted} yeni kayıt`);
    console.log(`⏭️  Zaten var (atlandı): ${skipped} kayıt`);
    console.log('\n✨ Besin veritabanı başarıyla güncellendi!\n');
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('\n❌ Hata:', err.message);
  process.exit(1);
});
