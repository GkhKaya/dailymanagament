import mongoose, { Schema, Document } from 'mongoose';

export interface IFoodCache extends Document {
  food_name: string;          // Türkçe yemek adı (arama için)
  food_name_en?: string;      // İngilizce karşılığı
  unit_type: 'gram' | 'adet'; // Birimi: gram bazlı mı, adet bazlı mı
  per_unit: {
    // 1 gram veya 1 adet için beslenme değerleri
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number;
  };
  brand_name?: string;        // Markalı ürünler için
  source: 'gemini' | 'manual' | 'seed'; // Verinin kaynağı
  ai_provider?: 'gemini' | 'openrouter';
  nutrition_basis?: 'per_gram' | 'per_unit';
  generated_at?: Date;
  search_tags?: string[];     // Ek arama etiketleri
  created_at: Date;
  updated_at: Date;
}

const FoodCacheSchema: Schema = new Schema({
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
  source: { type: String, enum: ['gemini', 'manual', 'seed'], default: 'manual' },
  ai_provider: { type: String, enum: ['gemini', 'openrouter'], default: null },
  nutrition_basis: { type: String, enum: ['per_gram', 'per_unit'], default: null },
  generated_at: { type: Date, default: null },
  search_tags: [{ type: String }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Text index for Turkish/English name search
FoodCacheSchema.index({ food_name: 'text', food_name_en: 'text', search_tags: 'text' });
// Unique on food_name + brand_name combination
FoodCacheSchema.index({ food_name: 1, brand_name: 1 }, { unique: true });

export const FoodCache = mongoose.models.FoodCache || mongoose.model<IFoodCache>('FoodCache', FoodCacheSchema);
