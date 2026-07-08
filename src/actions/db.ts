"use server";

import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { WeightLog } from '@/models/WeightLog';
import { DailyLog } from '@/models/DailyLog';
import { FoodCache } from '@/models/FoodCache';
import { Account } from '@/models/Account';
import { Category } from '@/models/Category';
import { Transaction } from '@/models/Transaction';
import { Subscription } from '@/models/Subscription';
import { Debt } from '@/models/Debt';

export async function syncDatabaseSchemas() {
  try {
    await connectDB();
    
    console.log('Syncing database indexes...');

    const models = [
      User, WeightLog, DailyLog, FoodCache, Account, Category, Transaction, Subscription, Debt
    ];

    for (const model of models) {
      // Ensure collection exists (Mongoose will create it if we just do syncIndexes, but creating it explicitly is safe too)
      try {
        await model.createCollection();
      } catch (err: any) {
        // Ignore "Namespace exists" error
        if (err.code !== 48) {
          console.warn(`Could not create collection for ${model.modelName}:`, err.message);
        }
      }
      
      // Sync indexes
      await model.syncIndexes();
      console.log(`Synced indexes for ${model.modelName}`);
    }

    return { success: true, message: 'Veritabanı şemaları ve indeksleri başarıyla senkronize edildi.' };
  } catch (error: any) {
    console.error('Veritabanı senkronizasyon hatası:', error);
    return { success: false, error: error.message || 'Bilinmeyen bir hata oluştu' };
  }
}
