import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testFatSecret() {
  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;
  
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const tokenRes = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials&scope=basic'
  });
  
  const tokenData = await tokenRes.json();
  console.log("Token response:", tokenData);
  
  const searchUrl = new URL('https://platform.fatsecret.com/rest/server.api');
  searchUrl.searchParams.append('method', 'foods.search');
  searchUrl.searchParams.append('search_expression', 'elma');
  searchUrl.searchParams.append('format', 'json');
  searchUrl.searchParams.append('max_results', '3');
  searchUrl.searchParams.append('region', 'TR');
  searchUrl.searchParams.append('language', 'tr');
  
  const searchRes = await fetch(searchUrl.toString(), {
    headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
  });
  
  const searchData = await searchRes.json();
  console.log("Search TR/tr 'elma':", JSON.stringify(searchData, null, 2));

  // Try without region/language
  const searchUrlEn = new URL('https://platform.fatsecret.com/rest/server.api');
  searchUrlEn.searchParams.append('method', 'foods.search');
  searchUrlEn.searchParams.append('search_expression', 'apple');
  searchUrlEn.searchParams.append('format', 'json');
  searchUrlEn.searchParams.append('max_results', '3');
  
  const searchResEn = await fetch(searchUrlEn.toString(), {
    headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
  });
  
  const searchDataEn = await searchResEn.json();
  console.log("Search No Region 'apple':", JSON.stringify(searchDataEn, null, 2));
}

testFatSecret();
