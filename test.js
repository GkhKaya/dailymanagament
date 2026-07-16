const http = require('http');

http.get('http://localhost:3000/api/fatsecret/search?query=egg', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log("Parsed response keys:", Object.keys(parsed));
      console.log("Is parsed.foods an array?", Array.isArray(parsed.foods));
      if (Array.isArray(parsed.foods)) {
        console.log("Length:", parsed.foods.length);
      } else {
        console.log("parsed.foods:", typeof parsed.foods);
      }
    } catch (e) {
      console.log("Error parsing JSON:", e, data);
    }
  });
}).on('error', err => console.log(err));
