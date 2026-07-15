import { NextResponse } from 'next/server';

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

async function getFatSecretToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('FatSecret API keys are missing in environment variables.');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials&scope=basic'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch FatSecret access token');
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;

  return cachedToken;
}

const FALLBACK_FOODS = [
  { id: "fallback_1", name: "Yumurta (Haşlanmış)", desc: "1 adet - Kalori: 78kcal | Yağ: 5.3g | Karb: 0.6g | Protein: 6.3g", c: 78, p: 6.3, f: 5.3, cb: 0.6 },
  { id: "fallback_2", name: "Beyaz Ekmek", desc: "1 dilim - Kalori: 79kcal | Yağ: 0.8g | Karb: 14.7g | Protein: 2.7g", c: 79, p: 2.7, f: 0.8, cb: 14.7 },
  { id: "fallback_3", name: "Süt (Tam Yağlı)", desc: "1 bardak (200ml) - Kalori: 122kcal | Yağ: 6.5g | Karb: 9.4g | Protein: 6.4g", c: 122, p: 6.4, f: 6.5, cb: 9.4 },
  { id: "fallback_4", name: "Tavuk Göğsü (Izgara)", desc: "100g - Kalori: 165kcal | Yağ: 3.6g | Karb: 0g | Protein: 31g", c: 165, p: 31, f: 3.6, cb: 0 },
  { id: "fallback_5", name: "Pirinç Pilavı", desc: "1 porsiyon (150g) - Kalori: 195kcal | Yağ: 4.5g | Karb: 34g | Protein: 3.5g", c: 195, p: 3.5, f: 4.5, cb: 34 },
  { id: "fallback_6", name: "Elma", desc: "1 orta boy - Kalori: 95kcal | Yağ: 0.3g | Karb: 25g | Protein: 0.5g", c: 95, p: 0.5, f: 0.3, cb: 25 },
  { id: "fallback_7", name: "Mercimek Çorbası", desc: "1 kase - Kalori: 138kcal | Yağ: 4g | Karb: 20g | Protein: 7g", c: 138, p: 7, f: 4, cb: 20 },
  { id: "fallback_8", name: "Su", desc: "1 bardak - Kalori: 0kcal | Yağ: 0g | Karb: 0g | Protein: 0g", c: 0, p: 0, f: 0, cb: 0 }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const foodId = searchParams.get('foodId');

  if (!foodId) {
    return NextResponse.json({ error: 'foodId parameter is required' }, { status: 400 });
  }

  if (foodId.startsWith('fallback_')) {
    const fallbackItem = FALLBACK_FOODS.find(f => f.id === foodId);
    if (fallbackItem) {
      return NextResponse.json({
        servings: [{
          metric_serving_unit: "g",
          metric_serving_amount: "100",
          measurement_description: "1 adet",
          calories: fallbackItem.c.toString(),
          carbohydrate: fallbackItem.cb.toString(),
          protein: fallbackItem.p.toString(),
          fat: fallbackItem.f.toString(),
          number_of_units: "1"
        }]
      });
    }
  }

  try {
    const token = await getFatSecretToken();
    
    const detailsUrl = new URL('https://platform.fatsecret.com/rest/server.api');
    detailsUrl.searchParams.append('method', 'food.get.v2');
    detailsUrl.searchParams.append('food_id', foodId);
    detailsUrl.searchParams.append('format', 'json');
    detailsUrl.searchParams.append('region', 'TR');
    detailsUrl.searchParams.append('language', 'tr');

    const response = await fetch(detailsUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('FatSecret details failed');
    }

    const data = await response.json();
    
    if (data.error) {
      return NextResponse.json({ error: data.error.message || 'FatSecret API error' }, { status: 400 });
    }

    // Return just the servings array for convenience, or the whole food object
    // In FatSecret: data.food.servings.serving
    const servingData = data.food?.servings?.serving;
    const servingsArray = Array.isArray(servingData) ? servingData : (servingData ? [servingData] : []);

    return NextResponse.json({
        servings: servingsArray
    });
  } catch (error: any) {
    console.error('FatSecret Details Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
