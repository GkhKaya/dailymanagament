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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const token = await getFatSecretToken();
    
    // FatSecret search API URL
    const searchUrl = new URL('https://platform.fatsecret.com/rest/server.api');
    searchUrl.searchParams.append('method', 'foods.search');
    searchUrl.searchParams.append('search_expression', query);
    searchUrl.searchParams.append('format', 'json');
    searchUrl.searchParams.append('max_results', '10');
    searchUrl.searchParams.append('region', 'TR');
    searchUrl.searchParams.append('language', 'tr');

    const searchResponse = await fetch(searchUrl.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      throw new Error('FatSecret search failed');
    }

    const data = await searchResponse.json();
    
    // FatSecret returns 200 OK even for errors, but includes an "error" object
    if (data.error) {
      return NextResponse.json({ error: data.error.message || 'FatSecret API error', code: data.error.code }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('FatSecret API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
