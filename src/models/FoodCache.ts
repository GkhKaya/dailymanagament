import mongoose, { Schema, Document } from 'mongoose';

export interface IFoodPortion {
  name: string;             // örn: "1 su bardağı", "1 porsiyon", "1 dilim", "1 yemek kaşığı"
  gram_weight: number;      // karşılık geldiği gram ağırlığı (örn: 200, 250, 30, 15)
  label?: string;           // ek açıklama örn: "200 ml"
}

export interface IFoodCache extends Document {
  user_id?: string | null;    // Kullanıcıya özel besinler için (null = global herkes görür)
  food_name: string;          // Türkçe yemek adı (arama için)
  food_name_en?: string;      // İngilizce karşılığı
  unit_type: 'gram' | 'adet' | 'kase' | 'bardak' | 'tabak' | 'çay kaşığı' | 'tatlı kaşığı' | 'çorba kaşığı' | 'yemek kaşığı'; // Birimi
  per_unit: {
    // 1 gram veya 1 adet için beslenme değerleri
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    sugar_g: number;
    fiber_g?: number;
  };
  portions?: IFoodPortion[];  // Ev tipi porsiyon alternatifleri (FatSecret tarzı bardak, kaşık vb.)
  brand_name?: string;        // Markalı ürünler için
  source: 'gemini' | 'manual' | 'seed' | 'openfoodfacts' | 'turkomp' | 'restaurant'; // Verinin kaynağı
  ai_provider?: 'gemini' | 'openrouter';
  nutrition_basis?: 'per_gram' | 'per_unit';
  generated_at?: Date;
  search_tags?: string[];     // Ek arama etiketleri
  created_at: Date;
  updated_at: Date;
}

const FoodPortionSchema = new Schema({
  name: { type: String, required: true },
  gram_weight: { type: Number, required: true },
  label: { type: String, default: null }
}, { _id: false });

const FoodCacheSchema: Schema = new Schema({
  user_id: { type: String, ref: 'User', default: null },
  food_name: { type: String, required: true },
  food_name_en: { type: String, default: null },
  unit_type: { type: String, enum: ['gram', 'adet', 'kase', 'bardak', 'tabak', 'çay kaşığı', 'tatlı kaşığı', 'çorba kaşığı', 'yemek kaşığı'], default: 'gram' },
  per_unit: {
    calories: { type: Number, required: true },
    protein_g: { type: Number, required: true },
    carbs_g: { type: Number, required: true },
    fat_g: { type: Number, required: true },
    sugar_g: { type: Number, default: 0 },
    fiber_g: { type: Number, default: null }
  },
  portions: [FoodPortionSchema],
  brand_name: { type: String, default: null },
  source: { type: String, enum: ['gemini', 'manual', 'seed', 'openfoodfacts', 'turkomp', 'restaurant'], default: 'manual' },
  ai_provider: { type: String, enum: ['gemini', 'openrouter'], default: null },
  nutrition_basis: { type: String, enum: ['per_gram', 'per_unit'], default: null },
  generated_at: { type: Date, default: null },
  search_tags: [{ type: String }]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Text index for Turkish/English name search
FoodCacheSchema.index({ food_name: 'text', food_name_en: 'text', search_tags: 'text' });
// Index on food_name + brand_name + user_id
FoodCacheSchema.index({ food_name: 1, brand_name: 1, user_id: 1 });
FoodCacheSchema.index({ user_id: 1 });

export const FoodCache = mongoose.models.FoodCache || mongoose.model<IFoodCache>('FoodCache', FoodCacheSchema);

