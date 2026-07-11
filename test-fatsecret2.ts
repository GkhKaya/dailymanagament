async function test() {
  const clientId = '65df4bee7ec44feb9b2d8b9c5cf51bb7';
  const clientSecret = '10965a0b1c68422c8ad057867496155b';
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
  if (!tokenData.access_token) return;

  const searchUrl = new URL('https://platform.fatsecret.com/rest/server.api');
  searchUrl.searchParams.append('method', 'foods.search.v2');
  searchUrl.searchParams.append('search_expression', 'pirinç');
  searchUrl.searchParams.append('format', 'json');
  searchUrl.searchParams.append('max_results', '10');

  const searchRes = await fetch(searchUrl.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json'
    }
  });

  const searchData = await searchRes.json();
  console.log('Search Data:', JSON.stringify(searchData, null, 2));
}

test();
