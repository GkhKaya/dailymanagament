/**
 * Market Service for Multi-Exchange Assets:
 * 1. Borsa İstanbul (BIST) Stocks & TEFAS Mutual Funds (TRY)
 * 2. US Stock Market: NASDAQ / NYSE (USD)
 * 3. Cryptocurrency: Major Crypto Assets (USD)
 * 
 * Sources:
 * - Stocks & Crypto: Yahoo Finance Chart API (Opening & closing reference data)
 * - TEFAS Funds: Official TEFAS JSON API (Daily valuation)
 */

import { BIST_COMPANIES, BistCompany } from './bist-directory';
import { POPULAR_US_STOCKS, POPULAR_CRYPTO_ASSETS, MarketAsset } from './us-crypto-directory';

export interface MarketQuote {
  symbol: string;
  name?: string;
  assetType: 'stock' | 'fund' | 'crypto';
  market?: 'bist' | 'us' | 'crypto';
  currency?: string;
  currentPrice: number;
  openPrice: number;
  closePrice: number;
  dayChangePercent: number;
  dayHigh?: number;
  dayLow?: number;
  updatedAt: Date;
}

// In-memory memory cache for market quotes (5 minute TTL)
const quoteCache = new Map<string, { quote: MarketQuote; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

// Well-known TEFAS funds fallback dictionary
export const POPULAR_TEFAS_FUNDS: Record<string, string> = {
  THF: 'Tera Portföy Hisse Senedi Fonu',
  PHE: 'Pusula Portföy Hisse Senedi Fonu',
  MAC: 'Marmara Capital Portföy Hisse Senedi Fonu',
  TI3: 'İş Portföy BIST 100 Dışı Şirketler Hisse Senedi Fonu',
  AFT: 'Ak Portföy Yeni Teknolojiler Yabancı Hisse Senedi Fonu',
  TTE: 'İş Portföy BIST Teknoloji Ağırlıklı Sınırlamalı Hisse Senedi Fonu',
  YAC: 'Yapı Kredi Portföy Koç Holding İştirak ve Hisse Senedi Fonu',
  BIO: 'İstanbul Portföy Blockchain Teknolojileri Değişken Fon',
  BUY: 'Bulls Portföy Birinci Hisse Senedi Fonu',
  HKH: 'Hedef Portföy Birinci Hisse Senedi Fonu',
  GMR: 'Inveo Portföy İkinci Hisse Senedi Fonu',
  NRC: 'Neo Portföy Birinci Hisse Senedi Fonu',
  ST1: 'Strateji Portföy Birinci Hisse Senedi Fonu',
  ZPE: 'Ziraat Portföy Katılım Endeksi Hisse Senedi Fonu'
};

const bistList: BistCompany[] = BIST_COMPANIES;

/**
 * Get all BIST companies from the directory
 */
export function getBistDirectory(): BistCompany[] {
  return bistList;
}

/**
 * Search across active markets (BIST, US Stocks, Crypto, TEFAS)
 */
export function searchMultiMarketAssets(
  query: string,
  activeMarkets: string[] = ['bist', 'us', 'crypto'],
  limit = 40
): Array<{ symbol: string; name: string; assetType: 'stock' | 'fund' | 'crypto'; market: 'bist' | 'us' | 'crypto'; currency: 'TRY' | 'USD' }> {
  const cleanQuery = query ? query.trim().toUpperCase() : '';
  const cleanQueryLower = query ? query.trim().toLowerCase() : '';
  const results: Array<{ symbol: string; name: string; assetType: 'stock' | 'fund' | 'crypto'; market: 'bist' | 'us' | 'crypto'; currency: 'TRY' | 'USD'; score: number }> = [];

  const includeBist = activeMarkets.length === 0 || activeMarkets.includes('bist');
  const includeUs = activeMarkets.length === 0 || activeMarkets.includes('us');
  const includeCrypto = activeMarkets.length === 0 || activeMarkets.includes('crypto');

  // 1. Crypto
  if (includeCrypto) {
    for (const c of POPULAR_CRYPTO_ASSETS) {
      if (!cleanQuery) {
        results.push({ ...c, assetType: 'crypto', score: 10 });
      } else if (c.symbol.includes(cleanQuery) || c.name.toLowerCase().includes(cleanQueryLower)) {
        const isExact = c.symbol === cleanQuery;
        const isPrefix = c.symbol.startsWith(cleanQuery);
        results.push({ ...c, assetType: 'crypto', score: isExact ? 110 : isPrefix ? 90 : 50 });
      }
    }
  }

  // 2. US Stocks
  if (includeUs) {
    for (const s of POPULAR_US_STOCKS) {
      if (!cleanQuery) {
        results.push({ ...s, assetType: 'stock', score: 10 });
      } else if (s.symbol.includes(cleanQuery) || s.name.toLowerCase().includes(cleanQueryLower)) {
        const isExact = s.symbol === cleanQuery;
        const isPrefix = s.symbol.startsWith(cleanQuery);
        results.push({ ...s, assetType: 'stock', score: isExact ? 105 : isPrefix ? 85 : 45 });
      }
    }
  }

  // 3. TEFAS Funds & BIST Stocks
  if (includeBist) {
    for (const [code, title] of Object.entries(POPULAR_TEFAS_FUNDS)) {
      if (!cleanQuery) {
        results.push({ symbol: code, name: title, assetType: 'fund', market: 'bist', currency: 'TRY', score: 5 });
      } else if (code.includes(cleanQuery) || title.toLowerCase().includes(cleanQueryLower)) {
        const isExact = code === cleanQuery;
        const isPrefix = code.startsWith(cleanQuery);
        results.push({ symbol: code, name: title, assetType: 'fund', market: 'bist', currency: 'TRY', score: isExact ? 100 : isPrefix ? 80 : 40 });
      }
    }

    for (const item of bistList) {
      const sym = item.symbol.toUpperCase();
      const nameLower = item.name.toLowerCase();
      if (!cleanQuery) {
        if (results.length < limit) {
          results.push({ symbol: sym, name: item.name, assetType: 'stock', market: 'bist', currency: 'TRY', score: 5 });
        }
      } else if (sym.includes(cleanQuery) || nameLower.includes(cleanQueryLower)) {
        const isExact = sym === cleanQuery;
        const isPrefix = sym.startsWith(cleanQuery);
        results.push({ symbol: sym, name: item.name, assetType: 'stock', market: 'bist', currency: 'TRY', score: isExact ? 100 : isPrefix ? 80 : 40 });
      }
    }
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.symbol.localeCompare(b.symbol);
  });

  return results.slice(0, limit).map(({ symbol, name, assetType, market, currency }) => ({ symbol, name, assetType, market, currency }));
}

/**
 * Backward-compatible search BIST directory
 */
export function searchBistDirectory(query: string, limit = 40): Array<{ symbol: string; name: string; assetType: 'stock' | 'fund' }> {
  return searchMultiMarketAssets(query, ['bist'], limit).map(item => ({
    symbol: item.symbol,
    name: item.name,
    assetType: item.assetType === 'fund' ? 'fund' : 'stock'
  }));
}

/**
 * Fetch quote for a BIST, US, or Crypto asset via Yahoo Finance
 */
export async function fetchStockQuote(symbol: string, marketHint?: 'bist' | 'us' | 'crypto'): Promise<MarketQuote | null> {
  const cleanSymbol = symbol.trim().toUpperCase();
  if (!cleanSymbol) return null;

  const cacheKey = `quote:${cleanSymbol}`;
  const cached = quoteCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.quote;
  }

  let isCrypto = marketHint === 'crypto' || POPULAR_CRYPTO_ASSETS.some(c => c.symbol === cleanSymbol) || cleanSymbol.endsWith('-USD');
  let isUsStock = marketHint === 'us' || POPULAR_US_STOCKS.some(s => s.symbol === cleanSymbol);
  let isBist = marketHint === 'bist' || BIST_COMPANIES.some(b => b.symbol === cleanSymbol);

  let yahooSymbol = cleanSymbol;
  if (isCrypto) {
    yahooSymbol = cleanSymbol.includes('-') ? cleanSymbol : `${cleanSymbol}-USD`;
  } else if (isBist) {
    yahooSymbol = cleanSymbol.includes('.') ? cleanSymbol : `${cleanSymbol}.IS`;
  } else if (!isUsStock) {
    yahooSymbol = cleanSymbol.includes('.') ? cleanSymbol : (cleanSymbol.length >= 4 && !cleanSymbol.includes('-') ? `${cleanSymbol}.IS` : cleanSymbol);
  }

  const fetchYahoo = async (ticker: string) => {
    const urls = [
      `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`,
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`,
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept': 'application/json',
          },
          next: { revalidate: 300 },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.chart?.result?.[0]) {
            return json.chart.result[0];
          }
        }
      } catch {
        // try next
      }
    }
    return null;
  };

  let result = await fetchYahoo(yahooSymbol);
  if (!result && yahooSymbol.endsWith('.IS')) {
    yahooSymbol = cleanSymbol;
    result = await fetchYahoo(yahooSymbol);
    if (result) {
      isUsStock = true;
      isBist = false;
    }
  }
  if (!result && !yahooSymbol.includes('-')) {
    const cryptoSym = `${cleanSymbol}-USD`;
    result = await fetchYahoo(cryptoSym);
    if (result) {
      yahooSymbol = cryptoSym;
      isCrypto = true;
      isUsStock = false;
    }
  }

  // Binance Fallback for crypto assets
  if (!result && isCrypto) {
    try {
      const binanceRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${cleanSymbol}USDT`);
      if (binanceRes.ok) {
        const bData = await binanceRes.json();
        const curPrice = parseFloat(bData.lastPrice);
        const prevClose = parseFloat(bData.prevClosePrice) || parseFloat(bData.openPrice) || curPrice;
        const openPr = parseFloat(bData.openPrice) || prevClose;
        const changePct = parseFloat(bData.priceChangePercent) || 0;
        if (curPrice > 0) {
          const cryptoQuote: MarketQuote = {
            symbol: cleanSymbol,
            name: POPULAR_CRYPTO_ASSETS.find(c => c.symbol === cleanSymbol)?.name || cleanSymbol,
            assetType: 'crypto',
            market: 'crypto',
            currency: 'USD',
            currentPrice: Math.round(curPrice * 100) / 100,
            openPrice: Math.round(openPr * 100) / 100,
            closePrice: Math.round(prevClose * 100) / 100,
            dayChangePercent: Math.round(changePct * 100) / 100,
            updatedAt: new Date(),
          };
          quoteCache.set(cacheKey, { quote: cryptoQuote, expiresAt: Date.now() + CACHE_TTL_MS });
          return cryptoQuote;
        }
      }
    } catch {
      // ignore
    }
  }

  if (!result) return null;

  const meta = result.meta;
  const quotes = result.indicators?.quote?.[0];

  const validCloses: number[] = quotes?.close
    ? quotes.close.filter((v: any): v is number => typeof v === 'number' && v > 0)
    : [];
  const validOpens: number[] = quotes?.open
    ? quotes.open.filter((v: any): v is number => typeof v === 'number' && v > 0)
    : [];

  const currentPrice = Number(meta.regularMarketPrice) || (validCloses.length > 0 ? validCloses[validCloses.length - 1] : 0);
  if (currentPrice <= 0) return null;

  let openPrice = validOpens.length > 0 ? validOpens[validOpens.length - 1] : (Number(meta.regularMarketOpen) || currentPrice);
  if (openPrice <= 0) openPrice = currentPrice;

  let closePrice = 0;
  if (validCloses.length >= 2) {
    closePrice = validCloses[validCloses.length - 2];
  } else if (typeof meta.chartPreviousClose === 'number' && meta.chartPreviousClose > 0) {
    closePrice = meta.chartPreviousClose;
  } else if (Number(meta.previousClose) > 0) {
    closePrice = Number(meta.previousClose);
  }
  if (closePrice <= 0) closePrice = openPrice;

  let dayChangePercent = Number(meta.regularMarketChangePercent) || 0;
  if ((dayChangePercent === 0 || !Number.isFinite(dayChangePercent)) && closePrice > 0) {
    dayChangePercent = Math.round(((currentPrice - closePrice) / closePrice) * 10000) / 100;
  }

  const detectedMarket: 'bist' | 'us' | 'crypto' = isCrypto ? 'crypto' : isUsStock ? 'us' : (meta.currency === 'TRY' ? 'bist' : 'us');
  const detectedAssetType: 'stock' | 'fund' | 'crypto' = isCrypto ? 'crypto' : 'stock';
  const currency = meta.currency || (detectedMarket === 'bist' ? 'TRY' : 'USD');

  const quote: MarketQuote = {
    symbol: cleanSymbol,
    name: meta.longName || meta.shortName || undefined,
    assetType: detectedAssetType,
    market: detectedMarket,
    currency,
    currentPrice: Math.round(currentPrice * 100) / 100,
    openPrice: Math.round(openPrice * 100) / 100,
    closePrice: Math.round(closePrice * 100) / 100,
    dayChangePercent: Math.round(dayChangePercent * 100) / 100,
    dayHigh: meta.regularMarketDayHigh ? Math.round(Number(meta.regularMarketDayHigh) * 100) / 100 : undefined,
    dayLow: meta.regularMarketDayLow ? Math.round(Number(meta.regularMarketDayLow) * 100) / 100 : undefined,
    updatedAt: new Date(),
  };

  quoteCache.set(cacheKey, { quote, expiresAt: Date.now() + CACHE_TTL_MS });
  return quote;
}

/**
 * Fetch quote for a TEFAS mutual fund via official TEFAS JSON API
 */
export async function fetchTefasFundQuote(fundCode: string): Promise<MarketQuote | null> {
  const cleanCode = fundCode.trim().toUpperCase();
  if (!cleanCode) return null;

  const cacheKey = `fund:${cleanCode}`;
  const cached = quoteCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.quote;
  }

  try {
    const res = await fetch('https://www.tefas.gov.tr/api/funds/fonFiyatBilgiGetir', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://www.tefas.gov.tr/',
        'Origin': 'https://www.tefas.gov.tr',
      },
      body: JSON.stringify({
        fonKodu: cleanCode,
        dil: 'TR',
        periyod: 1,
      }),
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const resultList = data.resultList;
    if (!resultList || !Array.isArray(resultList) || resultList.length === 0) {
      return null;
    }

    const latest = resultList[resultList.length - 1];
    const currentPrice = Number(latest.fiyat) || 0;
    if (currentPrice <= 0) return null;

    let previousPrice = currentPrice;
    if (resultList.length >= 2) {
      const prev = resultList[resultList.length - 2];
      previousPrice = Number(prev.fiyat) || currentPrice;
    }

    let dayChangePercent = 0;
    if (previousPrice > 0) {
      dayChangePercent = Math.round(((currentPrice - previousPrice) / previousPrice) * 10000) / 100;
    }

    const quote: MarketQuote = {
      symbol: cleanCode,
      name: latest.fonUnvan || POPULAR_TEFAS_FUNDS[cleanCode] || undefined,
      assetType: 'fund',
      market: 'bist',
      currency: 'TRY',
      currentPrice,
      openPrice: previousPrice,
      closePrice: currentPrice,
      dayChangePercent,
      updatedAt: new Date(),
    };

    quoteCache.set(cacheKey, { quote, expiresAt: Date.now() + CACHE_TTL_MS });
    return quote;
  } catch (error) {
    console.error(`fetchTefasFundQuote error for ${cleanCode}:`, error);
    return null;
  }
}

/**
 * Unified price fetcher: Dispatches to TEFAS or Yahoo Finance based on symbol/assetType
 */
export async function fetchMarketQuote(
  symbol: string,
  assetType?: 'stock' | 'fund' | 'crypto',
  marketHint?: 'bist' | 'us' | 'crypto'
): Promise<MarketQuote | null> {
  const cleanSymbol = symbol.trim().toUpperCase();
  if (!cleanSymbol) return null;

  // 1. If explicitly marked as fund or in known funds dictionary, fetch from TEFAS
  if (assetType === 'fund' || POPULAR_TEFAS_FUNDS[cleanSymbol]) {
    const fundQuote = await fetchTefasFundQuote(cleanSymbol);
    if (fundQuote) return fundQuote;
  }

  // 2. Otherwise fetch via Yahoo Finance (supports BIST, US, and Crypto)
  const stockQuote = await fetchStockQuote(cleanSymbol, marketHint);
  if (stockQuote) return stockQuote;

  // 3. Fallback: If 3-character ticker and stock failed, test TEFAS
  if (cleanSymbol.length === 3) {
    const fundQuote = await fetchTefasFundQuote(cleanSymbol);
    if (fundQuote) return fundQuote;
  }

  return null;
}
