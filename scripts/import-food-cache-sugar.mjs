/**
 * Doldurulmuş FoodCache şeker verilerini yalnızca kayıt ID'si üzerinden içeri alır.
 * Çalıştırma: npm run import:food-sugar
 */

import { readFileSync } from 'fs';
import { MongoClient, ObjectId } from 'mongodb';

const DB_NAME = 'dailymanagament';
const INPUT_FILE = 'data/food-cache-sugar-filled.json';

function loadEnv() {
  const envFile = readFileSync('.env.local', 'utf8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex < 0) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[key] = value;
  }
}

function readFoods() {
  const payload = JSON.parse(readFileSync(INPUT_FILE, 'utf8'));
  const foods = Array.isArray(payload) ? payload : payload.foods;
  if (!Array.isArray(foods) || foods.length === 0) throw new Error('JSON içinde foods dizisi bulunamadı.');

  const ids = new Set();
  return foods.map((food, index) => {
    if (!food?.id || !ObjectId.isValid(food.id)) throw new Error(`Geçersiz id: kayıt ${index + 1}`);
    if (ids.has(food.id)) throw new Error(`Tekrarlanan id: ${food.id}`);
    ids.add(food.id);
    const sugar = food?.per_unit?.sugar_g;
    if (typeof sugar !== 'number' || !Number.isFinite(sugar) || sugar < 0) {
      throw new Error(`Geçersiz sugar_g: ${food.food_name || food.id}`);
    }
    return { id: new ObjectId(food.id), sugar_g: sugar };
  });
}

async function main() {
  loadEnv();
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI bulunamadı.');
  const importedFoods = readFoods();
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const collection = client.db(DB_NAME).collection('foodcaches');
    const databaseIds = new Set((await collection.find({}, { projection: { _id: 1 } }).toArray()).map((food) => food._id.toString()));
    const missingIds = importedFoods.filter((food) => !databaseIds.has(food.id.toString()));
    if (missingIds.length > 0 || databaseIds.size !== importedFoods.length) {
      throw new Error(`Kayıt kümesi eşleşmedi: JSON ${importedFoods.length}, DB ${databaseIds.size}, DB'de bulunamayan ${missingIds.length}.`);
    }

    const result = await collection.bulkWrite(importedFoods.map((food) => ({
      updateOne: {
        filter: { _id: food.id },
        update: { $set: { 'per_unit.sugar_g': food.sugar_g } }
      }
    })));
    console.log(`✅ ${result.matchedCount} kayıt eşleşti, ${result.modifiedCount} kayıt güncellendi.`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(`❌ Şeker içe aktarma başarısız: ${error.message}`);
  process.exitCode = 1;
});
