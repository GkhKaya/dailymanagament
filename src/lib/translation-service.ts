/**
 * Translation Service for Nutrition PDF Export using Google Translate API
 * 
 * Supports:
 * - Google Translate API (clients5.google.com/translate_a/t)
 * - FoodCache database fallback (checks existing English names)
 * - Built-in dictionary for common nutrition units, portions, meals and exercises
 * - In-memory LRU cache to avoid duplicate translations
 */

import type { ExportDayData, ExportFoodItem, ExportWeekSummary } from '../actions/export';

// In-memory cache for translated phrases
const translationCache = new Map<string, string>();

// Pre-seeded standard dictionary for nutrition terminology
const COMMON_DICTIONARY: Record<string, string> = {
  // Meals
  'Kahvaltı': 'Breakfast',
  'Öğle Yemeği': 'Lunch',
  'Akşam Yemeği': 'Dinner',
  'Ara Öğün / Atıştırmalık': 'Snacks / In-Between Meals',
  'Ara Öğünler / Atıştırmalık': 'Snacks / In-Between Meals',
  'Ara Öğün': 'Snack',

  // Days of week
  'Pazartesi': 'Monday',
  'Salı': 'Tuesday',
  'Çarşamba': 'Wednesday',
  'Perşembe': 'Thursday',
  'Cuma': 'Friday',
  'Cumartesi': 'Saturday',
  'Pazar': 'Sunday',

  // Common units & portions
  'porsiyon': 'serving',
  '1 porsiyon': '1 serving',
  'yarım porsiyon': '0.5 serving',
  'adet': 'piece',
  '1 adet': '1 piece',
  'dilim': 'slice',
  '1 dilim': '1 slice',
  '2 dilim': '2 slices',
  '3 dilim': '3 slices',
  'bardak': 'glass',
  '1 bardak': '1 glass',
  'su bardağı': 'water glass',
  'çay bardağı': 'tea glass',
  'kase': 'bowl',
  '1 kase': '1 bowl',
  'tabak': 'plate',
  '1 tabak': '1 plate',
  'yemek kaşığı': 'tablespoon',
  '1 yemek kaşığı': '1 tbsp',
  '2 yemek kaşığı': '2 tbsp',
  'tatlı kaşığı': 'dessert spoon',
  'çay kaşığı': 'teaspoon',
  '1 çay kaşığı': '1 tsp',
  'avuç': 'handful',
  '1 avuç': '1 handful',
  'gram': 'g',
  '100 gram': '100g',

  // Common activities
  'Yürüyüş': 'Walking',
  'Tempolu Yürüyüş': 'Brisk Walking',
  'Koşu': 'Running',
  'Koşu Bandı': 'Treadmill',
  'Ağırlık Antrenmanı': 'Weight Training',
  'Fitness': 'Fitness Workout',
  'Kardiyo': 'Cardio',
  'Yüzme': 'Swimming',
  'Bisiklet': 'Cycling',
  'Pilates': 'Pilates',
  'Yoga': 'Yoga',
  'Esneme': 'Stretching',
};

// Populate memory cache with built-in dictionary
for (const [tr, en] of Object.entries(COMMON_DICTIONARY)) {
  translationCache.set(tr.toLowerCase().trim(), en);
}

/**
 * Translates a single text using Google Translate
 */
async function fetchGoogleTranslate(text: string): Promise<string> {
  const clean = text.trim();
  if (!clean) return text;

  const cached = translationCache.get(clean.toLowerCase());
  if (cached) return cached;

  try {
    const q = encodeURIComponent(clean);
    const res = await fetch(`https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=tr&tl=en&q=${q}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      next: { revalidate: 86400 }, // 24 hours cache in Next.js
    });

    if (!res.ok) return clean;

    const data = await res.json();
    const translated = Array.isArray(data)
      ? (typeof data[0] === 'string' ? data[0] : (Array.isArray(data[0]) ? data[0][0] : clean))
      : String(data);

    if (translated && typeof translated === 'string') {
      translationCache.set(clean.toLowerCase(), translated);
      return translated;
    }
  } catch (err) {
    console.error(`Google Translate error for "${clean}":`, err);
  }

  return clean;
}

/**
 * Translates a batch of phrases efficiently using newline delimiter
 */
export async function translateBatch(texts: string[]): Promise<Map<string, string>> {
  const resultMap = new Map<string, string>();
  const toFetch: string[] = [];

  // Check memory cache first
  for (const raw of texts) {
    const clean = raw?.trim();
    if (!clean) continue;

    const cached = translationCache.get(clean.toLowerCase());
    if (cached) {
      resultMap.set(clean, cached);
    } else {
      toFetch.push(clean);
    }
  }

  if (toFetch.length === 0) {
    return resultMap;
  }

  // Check database FoodCache for any known foods with food_name_en
  try {
    const dbMod = await import('@/lib/db').catch(() => import('./db.ts' as any)).catch(() => null);
    const modelMod = await import('@/models/FoodCache').catch(() => import('../models/FoodCache.ts' as any)).catch(() => null);
    if (dbMod && modelMod) {
      const { connectDB } = dbMod;
      const { FoodCache } = modelMod;
      await connectDB();
      const dbMatches = await FoodCache.find({
        food_name: { $in: toFetch.map((t: string) => new RegExp(`^${t}$`, 'i')) },
        food_name_en: { $exists: true, $ne: '' }
      }).select('food_name food_name_en').lean();

      for (const match of dbMatches) {
        if (match.food_name_en) {
          translationCache.set(match.food_name.toLowerCase(), match.food_name_en);
          resultMap.set(match.food_name, match.food_name_en);
        }
      }
    }
  } catch {
    // Graceful fallback to Google Translate if DB is unavailable
  }

  // Filter items still needing Google Translate
  const remaining = toFetch.filter(item => !resultMap.has(item));
  if (remaining.length === 0) {
    return resultMap;
  }

  // Chunk in batches of 20 to avoid URL length limits
  const CHUNK_SIZE = 20;
  for (let i = 0; i < remaining.length; i += CHUNK_SIZE) {
    const chunk = remaining.slice(i, i + CHUNK_SIZE);
    try {
      const joined = chunk.join('\n');
      const q = encodeURIComponent(joined);
      const res = await fetch(`https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=tr&tl=en&q=${q}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
      });

      if (res.ok) {
        const data = await res.json();
        const text = Array.isArray(data)
          ? (typeof data[0] === 'string' ? data[0] : (Array.isArray(data[0]) ? data[0][0] : ''))
          : String(data);

        const lines = text.split('\n');
        chunk.forEach((original, idx) => {
          const trans = lines[idx]?.trim() || original;
          translationCache.set(original.toLowerCase(), trans);
          resultMap.set(original, trans);
        });
      } else {
        // Fallback individually
        for (const item of chunk) {
          const trans = await fetchGoogleTranslate(item);
          resultMap.set(item, trans);
        }
      }
    } catch (err) {
      console.error('Batch translation chunk error, falling back:', err);
      for (const item of chunk) {
        const trans = await fetchGoogleTranslate(item);
        resultMap.set(item, trans);
      }
    }
  }

  return resultMap;
}

/**
 * Format a Turkish date string like "04.09.2026" or "04 Eylül 2026" to English
 */
export function formatEnglishDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }
  return dateStr;
}

/**
 * Translates a single ExportFoodItem
 */
function translateFoodItem(item: ExportFoodItem, translations: Map<string, string>): ExportFoodItem {
  const transName = translations.get(item.name) || item.name;
  const transAmount = translations.get(item.amount) || item.amount;
  return {
    ...item,
    name: transName,
    amount: transAmount,
  };
}

/**
 * Translates an ExportDayData object into English
 */
export async function translateDayDataToEnglish(day: ExportDayData): Promise<ExportDayData> {
  // Collect all unique strings from meals and exercises
  const allPhrases = new Set<string>();

  const checkAndAdd = (item?: ExportFoodItem) => {
    if (item?.name) allPhrases.add(item.name);
    if (item?.amount) allPhrases.add(item.amount);
  };

  day.meals.breakfast.forEach(checkAndAdd);
  day.meals.lunch.forEach(checkAndAdd);
  day.meals.dinner.forEach(checkAndAdd);
  day.meals.snack.forEach(checkAndAdd);

  day.exercises.forEach(ex => {
    if (ex.name) allPhrases.add(ex.name);
  });

  const translations = await translateBatch(Array.from(allPhrases));

  return {
    ...day,
    dateFormatted: formatEnglishDate(day.dateFormatted || day.date),
    meals: {
      breakfast: day.meals.breakfast.map(item => translateFoodItem(item, translations)),
      lunch: day.meals.lunch.map(item => translateFoodItem(item, translations)),
      dinner: day.meals.dinner.map(item => translateFoodItem(item, translations)),
      snack: day.meals.snack.map(item => translateFoodItem(item, translations)),
    },
    exercises: day.exercises.map(ex => ({
      ...ex,
      name: translations.get(ex.name) || ex.name,
    })),
  };
}

/**
 * Translates an ExportWeekSummary array into English
 */
export async function translateWeekSummariesToEnglish(weeks: ExportWeekSummary[]): Promise<ExportWeekSummary[]> {
  const allDayNames = new Set<string>();
  weeks.forEach(w => {
    w.days.forEach(d => {
      if (d.dayName) allDayNames.add(d.dayName);
    });
  });

  const translations = await translateBatch(Array.from(allDayNames));

  return weeks.map(w => ({
    ...w,
    weekName: w.weekName.replace(/Hafta/i, 'Week'),
    startDate: formatEnglishDate(w.startDate),
    endDate: formatEnglishDate(w.endDate),
    days: w.days.map(d => ({
      ...d,
      dayName: translations.get(d.dayName) || COMMON_DICTIONARY[d.dayName] || d.dayName,
    })),
  }));
}
