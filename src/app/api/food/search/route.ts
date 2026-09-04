import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FoodCache } from '@/models/FoodCache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

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
    const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
    const userId = session?.user?.id || null;

    const trimmed = query.trim();
    const safeRegex = escapeRegex(trimmed);

    // Filter to ensure users only see global foods + their own custom foods
    const userFilter = userId
      ? { $or: [{ user_id: null }, { user_id: { $exists: false } }, { user_id: userId }] }
      : { $or: [{ user_id: null }, { user_id: { $exists: false } }] };

    // 1. Text search (Türkçe/İngilizce)
    let foods = await FoodCache.find(
      {
        $and: [
          { $text: { $search: trimmed } },
          userFilter
        ]
      },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(30)
      .lean();

    // 2. Eğer text search az sonuç döndürdüyse regex ile de ara
    if (foods.length < 10) {
      const regexResults = await FoodCache.find({
        $and: [
          {
            $or: [
              { food_name: { $regex: safeRegex, $options: 'i' } },
              { food_name_en: { $regex: safeRegex, $options: 'i' } },
              { search_tags: { $regex: safeRegex, $options: 'i' } },
              { brand_name: { $regex: safeRegex, $options: 'i' } }
            ]
          },
          userFilter
        ]
      })
        .limit(30)
        .lean();

      // Tekrar edenleri çıkar
      const existingIds = new Set(foods.map((f: any) => f._id.toString()));
      const newResults = regexResults.filter((f: any) => !existingIds.has(f._id.toString()));
      foods = [...foods, ...newResults];
    }

    // 3. Akıllı Sıralama (In-memory sorting)
    const queryLower = trimmed.toLocaleLowerCase('tr-TR');
    
    foods.sort((a: any, b: any) => {
      const aName = (a.food_name || '').toLocaleLowerCase('tr-TR');
      const bName = (b.food_name || '').toLocaleLowerCase('tr-TR');
      
      const aIsCustom = Boolean(userId && a.user_id && a.user_id.toString() === userId);
      const bIsCustom = Boolean(userId && b.user_id && b.user_id.toString() === userId);

      // Tam eşleşme en üstte (Kullanıcının kendi eklediği tam eşleşme en üsttedir)
      const aExact = aName === queryLower;
      const bExact = bName === queryLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      if (aExact && bExact) {
        if (aIsCustom && !bIsCustom) return -1;
        if (!aIsCustom && bIsCustom) return 1;
      }
      
      // Aranan kelime ile başlayanlar ikinci sırada
      const aStartsWith = aName.startsWith(queryLower);
      const bStartsWith = bName.startsWith(queryLower);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      // Özel besinler genel ürünlerden önce gelsin
      if (aIsCustom && !bIsCustom) return -1;
      if (!aIsCustom && bIsCustom) return 1;
      
      // MongoDB textScore'a göre sırala (varsa)
      const aScore = a.score || 0;
      const bScore = b.score || 0;
      if (aScore !== bScore) return bScore - aScore;
      
      // Son çare olarak ismin kısalığına göre sırala
      return aName.length - bName.length;
    });

    // En iyi 20 sonucu al
    foods = foods.slice(0, 20);

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
        sugar_g: f.per_unit?.sugar_g || 0,
        fiber_g: f.per_unit?.fiber_g || 0
      },
      portions: Array.isArray(f.portions) ? f.portions : [],
      brand_name: f.brand_name || null,
      source: f.source,
      provider: f.ai_provider || null,
      is_custom: Boolean(userId && f.user_id && f.user_id.toString() === userId),
      nutrition_basis: f.nutrition_basis || (f.unit_type === 'gram' ? 'per_gram' : 'per_unit')
    }));

    return NextResponse.json({ foods: formatted });
  } catch (error: any) {
    console.error('Food search error:', error);
    return NextResponse.json({ foods: [], error: error.message }, { status: 500 });
  }
}
