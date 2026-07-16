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
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer

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
  { id: "fallback_8", name: "Su", desc: "1 bardak - Kalori: 0kcal | Yağ: 0g | Karb: 0g | Protein: 0g", c: 0, p: 0, f: 0, cb: 0 },
  { id: "fallback_9", name: "Muz", desc: "1 adet - Kalori: 105kcal | Yağ: 0.3g | Karb: 27g | Protein: 1.3g", c: 105, p: 1.3, f: 0.3, cb: 27 },
  { id: "fallback_10", name: "Salata (Zeytinyağlı)", desc: "1 porsiyon - Kalori: 150kcal | Yağ: 10g | Karb: 10g | Protein: 2g", c: 150, p: 2, f: 10, cb: 10 },
  { id: "fallback_11", name: "Tam Buğday Ekmek", desc: "1 dilim - Kalori: 69kcal | Yağ: 1g | Karb: 12g | Protein: 3.6g", c: 69, p: 3.6, f: 1, cb: 12 },
  { id: "fallback_12", name: "Peynir (Beyaz)", desc: "1 dilim (30g) - Kalori: 90kcal | Yağ: 7g | Karb: 1g | Protein: 5g", c: 90, p: 5, f: 7, cb: 1 },
  { id: "fallback_13", name: "Yoğurt", desc: "1 kase (150g) - Kalori: 90kcal | Yağ: 3g | Karb: 7g | Protein: 5g", c: 90, p: 5, f: 3, cb: 7 },
  { id: "fallback_14", name: "Köfte", desc: "1 porsiyon (150g) - Kalori: 250kcal | Yağ: 15g | Karb: 5g | Protein: 25g", c: 250, p: 25, f: 15, cb: 5 },
  { id: "fallback_15", name: "Makarna", desc: "1 porsiyon (150g) - Kalori: 220kcal | Yağ: 1g | Karb: 43g | Protein: 8g", c: 220, p: 8, f: 1, cb: 43 },
  { id: "fallback_16", name: "Simit", desc: "1 adet - Kalori: 275kcal | Yağ: 4g | Karb: 52g | Protein: 7g", c: 275, p: 7, f: 4, cb: 52 },
  { id: "fallback_17", name: "Çay", desc: "1 bardak - Kalori: 0kcal", c: 0, p: 0, f: 0, cb: 0 },
  { id: "fallback_18", name: "Kahve", desc: "1 fincan (sade) - Kalori: 2kcal", c: 2, p: 0, f: 0, cb: 0 }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  const generateFallbackResponse = (q: string) => {
    const qLower = q.toLowerCase();
    const matches = FALLBACK_FOODS.filter(f => f.name.toLowerCase().includes(qLower));
    return {
      foods: matches.map(m => ({
        food_id: m.id,
        food_name: m.name,
        food_description: m.desc
      }))
    };
  };

  try {
    const token = await getFatSecretToken();
    
    // FatSecret search API URL
    const searchUrl = new URL('https://platform.fatsecret.com/rest/server.api');
    searchUrl.searchParams.append('method', 'foods.search');
    searchUrl.searchParams.append('search_expression', query);
    searchUrl.searchParams.append('format', 'json');
    searchUrl.searchParams.append('max_results', '10');
    // Removed region and language to allow global search since free tier is restricted

    const searchResponse = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!searchResponse.ok) {
      throw new Error('FatSecret search failed');
    }

    const data = await searchResponse.json();
    console.log("Raw FatSecret Response:", JSON.stringify(data, null, 2));
    
    // FatSecret returns 200 OK even for errors, but includes an "error" object
    if (data.error) {
      return NextResponse.json({ error: data.error.message || 'FatSecret API error', code: data.error.code }, { status: 400 });
    }

    const foodData = data.foods?.food;
    const foodsArray = Array.isArray(foodData) ? foodData : (foodData ? [foodData] : []);

    if (foodsArray.length === 0) {
      console.log('FatSecret returned 0 results, using fallback for:', query);
      const fallbackData = generateFallbackResponse(query);
      if (fallbackData.foods.length > 0) {
        return NextResponse.json(fallbackData);
      }
    }

    return NextResponse.json({ foods: foodsArray });
  } catch (error: any) {
    console.error('FatSecret API Error, using fallback:', error.message);
    const fallbackData = generateFallbackResponse(query);
    if (fallbackData.foods.length > 0) {
      return NextResponse.json(fallbackData);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
