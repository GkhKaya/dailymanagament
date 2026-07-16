const http = require('http');

http.get('http://localhost:3000/api/fatsecret/details?foodId=3092', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log("Parsed details keys:", Object.keys(parsed));
      console.log("Is parsed.servings an array?", Array.isArray(parsed.servings));
      if (Array.isArray(parsed.servings)) {
        console.log("Servings length:", parsed.servings.length);
      } else {
        console.log("parsed.servings:", parsed.servings);
      }
    } catch (e) {
      console.log("Error parsing JSON:", e, data);
    }
  });
}).on('error', err => console.log(err));
