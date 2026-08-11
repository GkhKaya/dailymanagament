import { NextResponse } from 'next/server';

/**
 * Bu route artık kullanılmıyor.
 * Yeni sistem: /api/food/gemini
 * FatSecret entegrasyonu kaldırıldı.
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Bu endpoint kaldırıldı. Lütfen /api/food/gemini kullanın.' },
    { status: 410 }
  );
}
