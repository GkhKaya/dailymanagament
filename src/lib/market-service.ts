/**
 * Market Service for Borsa İstanbul (BIST) Stocks and TEFAS Mutual Funds
 * 
 * Sources:
 * 1. BIST & Global Stocks: Yahoo Finance Chart API (Free, real-time delayed, no API key required)
 * 2. TEFAS Funds: Official TEFAS JSON API (tefas.gov.tr/api/funds/fonFiyatBilgiGetir)
 * 3. BIST Company Directory: Official KAP BIST member list (800+ companies)
 */

import { BIST_COMPANIES, BistCompany } from './bist-directory';

export interface MarketQuote {
  symbol: string;
  name?: string;
  assetType: 'stock' | 'fund';
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
 * Search the comprehensive BIST directory and known funds by query
 */
export function searchBistDirectory(query: string, limit = 40): Array<{ symbol: string; name: string; assetType: 'stock' | 'fund' }> {
  if (!query || !query.trim()) {
    // Return top popular stocks
    return bistList.slice(0, limit).map(item => ({
      symbol: item.symbol,
      name: item.name,
      assetType: 'stock' as const,
    }));
  }

  const cleanQuery = query.trim().toUpperCase();
  const cleanQueryLower = query.trim().toLowerCase();

  const results: Array<{ symbol: string; name: string; assetType: 'stock' | 'fund'; score: number }> = [];

  // 1. Search in known TEFAS funds
  for (const [code, title] of Object.entries(POPULAR_TEFAS_FUNDS)) {
    if (code.includes(cleanQuery) || title.toLowerCase().includes(cleanQueryLower)) {
      const isExact = code === cleanQuery;
      const isPrefix = code.startsWith(cleanQuery);
      results.push({
        symbol: code,
        name: title,
        assetType: 'fund',
        score: isExact ? 100 : isPrefix ? 80 : 50,
      });
    }
  }

  // 2. Search in 800+ BIST companies
  for (const item of bistList) {
    const sym = item.symbol.toUpperCase();
    const nameLower = item.name.toLowerCase();

    if (sym.includes(cleanQuery) || nameLower.includes(cleanQueryLower)) {
      const isExact = sym === cleanQuery;
      const isPrefix = sym.startsWith(cleanQuery);
      results.push({
        symbol: sym,
        name: item.name,
        assetType: 'stock',
        score: isExact ? 100 : isPrefix ? 80 : 40,
      });
    }
  }

  // Sort by match score then by symbol
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.symbol.localeCompare(b.symbol);
  });

  return results.slice(0, limit).map(({ symbol, name, assetType }) => ({ symbol, name, assetType }));
}

/**
 * Fetch quote for a BIST or Global stock via Yahoo Finance
 */
export async function fetchStockQuote(symbol: string): Promise<MarketQuote | null> {
  const cleanSymbol = symbol.trim().toUpperCase();
  if (!cleanSymbol) return null;

  const cacheKey = `stock:${cleanSymbol}`;
  const cached = quoteCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.quote;
  }

  // Determine Yahoo symbol: if Turkish stock without dot, append .IS
  const isGlobalStock = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN', 'GOOGL', 'META'].includes(cleanSymbol);
  const yahooSymbol = isGlobalStock || cleanSymbol.includes('.') ? cleanSymbol : `${cleanSymbol}.IS`;

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=5d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
        next: { revalidate: 300 }, // 5 mins cache in Next.js
      }
    );

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    const result = json.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const quotes = result.indicators?.quote?.[0];

    const currentPrice = Number(meta.regularMarketPrice) || 0;
    if (currentPrice <= 0) return null;

    // Get open price
    let openPrice = Number(meta.regularMarketOpen) || 0;
    if (openPrice <= 0 && quotes?.open && quotes.open.length > 0) {
      const validOpens = quotes.open.filter((v: any) => typeof v === 'number' && v > 0);
      if (validOpens.length > 0) {
        openPrice = validOpens[validOpens.length - 1];
      }
    }
    if (openPrice <= 0) openPrice = currentPrice;

    // Get previous close (gün sonu referansı)
    let closePrice = Number(meta.chartPreviousClose) || Number(meta.previousClose) || 0;
    if (closePrice <= 0 && quotes?.close && quotes.close.length > 1) {
      const validCloses = quotes.close.filter((v: any) => typeof v === 'number' && v > 0);
      if (validCloses.length > 1) {
        closePrice = validCloses[validCloses.length - 2];
      }
    }
    if (closePrice <= 0) closePrice = openPrice;

    // Calculate percent change
    let dayChangePercent = Number(meta.regularMarketChangePercent) || 0;
    if (dayChangePercent === 0 && closePrice > 0) {
      dayChangePercent = Math.round(((currentPrice - closePrice) / closePrice) * 10000) / 100;
    }

    const quote: MarketQuote = {
      symbol: cleanSymbol,
      name: meta.longName || meta.shortName || undefined,
      assetType: 'stock',
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
  } catch (error) {
    console.error(`fetchStockQuote error for ${cleanSymbol}:`, error);
    return null;
  }
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
      next: { revalidate: 600 }, // 10 mins cache
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
      currentPrice: currentPrice,
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
  assetType?: 'stock' | 'fund'
): Promise<MarketQuote | null> {
  const cleanSymbol = symbol.trim().toUpperCase();
  if (!cleanSymbol) return null;

  // 1. If explicitly marked as fund or in known funds dictionary, fetch from TEFAS
  if (assetType === 'fund' || POPULAR_TEFAS_FUNDS[cleanSymbol]) {
    const fundQuote = await fetchTefasFundQuote(cleanSymbol);
    if (fundQuote) return fundQuote;
  }

  // 2. Otherwise try stock quote via Yahoo Finance
  const stockQuote = await fetchStockQuote(cleanSymbol);
  if (stockQuote) return stockQuote;

  // 3. Fallback: If 3-character ticker and stock failed, test TEFAS
  if (cleanSymbol.length === 3) {
    const fundQuote = await fetchTefasFundQuote(cleanSymbol);
    if (fundQuote) return fundQuote;
  }

  return null;
}
