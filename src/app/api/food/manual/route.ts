import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FoodCache } from '@/models/FoodCache';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
    const userId = session?.user?.id || null;

    const body = await req.json();

    const {
      food_name,
      brand_name,
      unit_type = 'gram',
      calories,
      protein_g,
      carbs_g,
      fat_g,
      sugar_g,
      fiber_g,
      portions
    } = body;

    if (!food_name || food_name.trim() === '') {
      return NextResponse.json({ error: 'Yemek adı zorunludur.' }, { status: 400 });
    }

    const cal = parseFloat(calories) || 0;
    const prot = parseFloat(protein_g) || 0;
    const carbs = parseFloat(carbs_g) || 0;
    const fat = parseFloat(fat_g) || 0;
    const sugar = parseFloat(sugar_g) || 0;
    const fiber = parseFloat(fiber_g) || 0;

    // Unit type is 'gram' or 'adet'
    // For 'gram', per_unit is per 1 gram (so divide 100g values by 100 if user entered per 100g or per 1 unit)
    const isGram = unit_type === 'gram';
    const divisor = isGram ? 100 : 1;

    const perUnit = {
      calories: Math.max(0, cal / divisor),
      protein_g: Math.max(0, prot / divisor),
      carbs_g: Math.max(0, carbs / divisor),
      fat_g: Math.max(0, fat / divisor),
      sugar_g: Math.max(0, sugar / divisor),
      fiber_g: Math.max(0, fiber / divisor)
    };

    const trimmedName = food_name.trim();
    const trimmedBrand = brand_name ? brand_name.trim() : null;

    // Check if food cache entry exists for this name, brand and user_id
    let foodCache = await FoodCache.findOne({
      food_name: trimmedName,
      brand_name: trimmedBrand,
      user_id: userId
    });

    if (foodCache) {
      foodCache.unit_type = unit_type;
      foodCache.per_unit = perUnit;
      foodCache.source = 'manual';
      if (Array.isArray(portions)) {
        foodCache.portions = portions;
      }
      await foodCache.save();
    } else {
      foodCache = await FoodCache.create({
        user_id: userId,
        food_name: trimmedName,
        brand_name: trimmedBrand,
        unit_type,
        per_unit: perUnit,
        portions: Array.isArray(portions) ? portions : [],
        source: 'manual',
        search_tags: [trimmedName.toLowerCase()]
      });
    }

    return NextResponse.json({
      success: true,
      food: {
        id: foodCache._id.toString(),
        food_name: foodCache.food_name,
        unit_type: foodCache.unit_type,
        per_unit: foodCache.per_unit,
        portions: foodCache.portions || [],
        is_custom: !!userId
      }
    });
  } catch (e: any) {
    console.error('Manual food API error:', e);
    return NextResponse.json({ error: e.message || 'Manuel yemek eklenirken hata oluştu' }, { status: 500 });
  }
}
