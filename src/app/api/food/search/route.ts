import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FoodCache } from '@/models/FoodCache';

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query || query.trim().length < 1) {
    return NextResponse.json({ foods: [] });
  }

  if (query.trim().length > 120) {
    return NextResponse.json({ foods: [], error: 'Arama metni çok uzun.' }, { status: 400 });
  }

  try {
    await connectDB();

    const trimmed = query.trim();
    const safeRegex = escapeRegex(trimmed);

    // 1. Text search (Türkçe/İngilizce)
    let foods = await FoodCache.find(
      { $text: { $search: trimmed } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(15)
      .lean();

    // 2. Eğer text search az sonuç döndürdüyse regex ile de ara
    if (foods.length < 5) {
      const regexResults = await FoodCache.find({
        $or: [
          { food_name: { $regex: safeRegex, $options: 'i' } },
          { food_name_en: { $regex: safeRegex, $options: 'i' } },
          { search_tags: { $regex: safeRegex, $options: 'i' } },
          { brand_name: { $regex: safeRegex, $options: 'i' } }
        ]
      })
        .limit(15)
        .lean();

      // Tekrar edenleri çıkar
      const existingIds = new Set(foods.map((f: any) => f._id.toString()));
      const newResults = regexResults.filter((f: any) => !existingIds.has(f._id.toString()));
      foods = [...foods, ...newResults].slice(0, 15);
    }

    const formatted = foods.map((f: any) => ({
      id: f._id.toString(),
      food_name: f.food_name,
      food_name_en: f.food_name_en || null,
      unit_type: f.unit_type || 'gram',
      per_unit: {
        calories: f.per_unit?.calories || 0,
        protein_g: f.per_unit?.protein_g || 0,
        carbs_g: f.per_unit?.carbs_g || 0,
        fat_g: f.per_unit?.fat_g || 0,
        fiber_g: f.per_unit?.fiber_g || 0
      },
      brand_name: f.brand_name || null,
      source: f.source,
      provider: f.ai_provider || null,
      nutrition_basis: f.nutrition_basis || (f.unit_type === 'gram' ? 'per_gram' : 'per_unit')
    }));

    return NextResponse.json({ foods: formatted });
  } catch (error: any) {
    console.error('Food search error:', error);
    return NextResponse.json({ foods: [], error: error.message }, { status: 500 });
  }
}
