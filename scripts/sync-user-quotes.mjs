import mongoose from 'mongoose';


const uri = process.env.MONGODB_URI;
console.log("Connecting to MongoDB URI:", uri ? uri.replace(/:[^:@]+@/, ':***@') : 'undefined');

await mongoose.connect(uri, {
  dbName: process.env.MONGODB_DB_NAME || 'dailymanagament'
});
console.log("Connected to DB:", mongoose.connection.name);

async function fetchYahoo(symbol) {
  const yahooSymbol = symbol.endsWith('.IS') ? symbol : `${symbol}.IS`;
  const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=5d`, {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  if (!res.ok) return null;
  const json = await res.json();
  const meta = json.chart?.result?.[0]?.meta;
  const quotes = json.chart?.result?.[0]?.indicators?.quote?.[0];
  if (!meta) return null;

  const currentPrice = Number(meta.regularMarketPrice) || 0;
  let openPrice = Number(meta.regularMarketOpen) || 0;
  if (openPrice <= 0 && quotes?.open) {
    const valid = quotes.open.filter(v => typeof v === 'number' && v > 0);
    if (valid.length > 0) openPrice = valid[valid.length - 1];
  }
  if (openPrice <= 0) openPrice = currentPrice;

  let closePrice = Number(meta.chartPreviousClose) || Number(meta.previousClose) || 0;
  if (closePrice <= 0 && quotes?.close && quotes.close.length > 1) {
    const valid = quotes.close.filter(v => typeof v === 'number' && v > 0);
    if (valid.length > 1) closePrice = valid[valid.length - 2];
  }
  if (closePrice <= 0) closePrice = openPrice;

  let dayChangePercent = Number(meta.regularMarketChangePercent) || 0;
  if (dayChangePercent === 0 && closePrice > 0) {
    dayChangePercent = Math.round(((currentPrice - closePrice) / closePrice) * 10000) / 100;
  }

  return {
    currentPrice: Math.round(currentPrice * 100) / 100,
    openPrice: Math.round(openPrice * 100) / 100,
    closePrice: Math.round(closePrice * 100) / 100,
    dayChangePercent: Math.round(dayChangePercent * 100) / 100,
    name: meta.longName || meta.shortName,
  };
}

async function fetchTefas(code) {
  const res = await fetch('https://www.tefas.gov.tr/api/funds/fonFiyatBilgiGetir', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0'
    },
    body: JSON.stringify({ fonKodu: code, dil: 'TR', periyod: 1 })
  });
  if (!res.ok) return null;
  const json = await res.json();
  const list = json.resultList;
  if (!list || list.length === 0) return null;

  const latest = list[list.length - 1];
  const currentPrice = Number(latest.fiyat) || 0;
  let prevPrice = currentPrice;
  if (list.length >= 2) {
    prevPrice = Number(list[list.length - 2].fiyat) || currentPrice;
  }
  let dayChangePercent = 0;
  if (prevPrice > 0) {
    dayChangePercent = Math.round(((currentPrice - prevPrice) / prevPrice) * 10000) / 100;
  }

  return {
    currentPrice,
    openPrice: prevPrice,
    closePrice: currentPrice,
    dayChangePercent,
    name: latest.fonUnvan
  };
}

const userId = process.argv[2] || '6a6114afcbefbca0ab79c274';

const positions = await mongoose.connection.collection('stockpositions').find({ user_id: userId }).toArray();
console.log(`Found ${positions.length} positions for user ${userId}:`);

for (const pos of positions) {
  console.log(`Checking ${pos.symbol} (total_lots: ${pos.total_lots}, asset_type: ${pos.asset_type})`);
  let quote = null;
  if (pos.asset_type === 'fund' || pos.symbol === 'THF') {
    quote = await fetchTefas(pos.symbol);
  } else {
    quote = await fetchYahoo(pos.symbol);
    if (!quote && pos.symbol.length === 3) {
      quote = await fetchTefas(pos.symbol);
    }
  }

  if (quote) {
    console.log(` -> Found quote: current=${quote.currentPrice}, open=${quote.openPrice}, close=${quote.closePrice}, change%=${quote.dayChangePercent}, name=${quote.name}`);
    const update = {
      current_price: quote.currentPrice,
      open_price: quote.openPrice,
      close_price: quote.closePrice,
      day_change_percent: quote.dayChangePercent,
      price_updated_at: new Date()
    };
    if (quote.name && (!pos.name || pos.name === pos.symbol)) {
      update.name = quote.name;
    }
    if (pos.symbol === 'THF') {
      update.asset_type = 'fund';
    }
    // Also recalculate current_value, unrealized_pnl, unrealized_pnl_percent if total_lots > 0
    if (pos.total_lots > 0) {
      const currentValue = Math.round(pos.total_lots * quote.currentPrice * 100) / 100;
      const unrealizedPnl = Math.round((currentValue - pos.total_cost) * 100) / 100;
      const unrealizedPnlPercent = pos.total_cost > 0 ? Math.round((unrealizedPnl / pos.total_cost) * 10000) / 100 : 0;
      update.current_value = currentValue;
      update.unrealized_pnl = unrealizedPnl;
      update.unrealized_pnl_percent = unrealizedPnlPercent;
    }
    await mongoose.connection.collection('stockpositions').updateOne(
      { _id: pos._id },
      { $set: update }
    );
    console.log(` -> Updated ${pos.symbol} successfully!`);
  } else {
    console.log(` -> Failed to fetch quote for ${pos.symbol}`);
  }
}

// Check updated open positions
const updated = await mongoose.connection.collection('stockpositions').find({ user_id: userId, total_lots: { $gt: 0 } }).toArray();
console.log("\n=================================");
console.log("Updated Open Positions for gkhnkya0000@gmail.com:");
for (const p of updated) {
  console.log(`- [${p.asset_type || 'stock'}] ${p.symbol} (${p.name}): ${p.total_lots} lots | avg_cost: ${p.average_cost} TL | current: ${p.current_price} TL | open: ${p.open_price} TL | close: ${p.close_price} TL | day_change: %${p.day_change_percent} | value: ${p.current_value} TL | P/L: ${p.unrealized_pnl} TL (%${p.unrealized_pnl_percent})`);
}
console.log("=================================\n");

await mongoose.disconnect();
