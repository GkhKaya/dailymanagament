export interface MarketAsset {
  symbol: string;
  name: string;
  market: 'bist' | 'us' | 'crypto';
  currency: 'TRY' | 'USD';
}

export const POPULAR_US_STOCKS: MarketAsset[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', market: 'us', currency: 'USD' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', market: 'us', currency: 'USD' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', market: 'us', currency: 'USD' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Google)', market: 'us', currency: 'USD' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', market: 'us', currency: 'USD' },
  { symbol: 'META', name: 'Meta Platforms Inc.', market: 'us', currency: 'USD' },
  { symbol: 'TSLA', name: 'Tesla Inc.', market: 'us', currency: 'USD' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', market: 'us', currency: 'USD' },
  { symbol: 'NFLX', name: 'Netflix Inc.', market: 'us', currency: 'USD' },
  { symbol: 'PLTR', name: 'Palantir Technologies', market: 'us', currency: 'USD' },
  { symbol: 'COIN', name: 'Coinbase Global Inc.', market: 'us', currency: 'USD' },
  { symbol: 'INTC', name: 'Intel Corporation', market: 'us', currency: 'USD' },
  { symbol: 'BABA', name: 'Alibaba Group', market: 'us', currency: 'USD' },
  { symbol: 'DIS', name: 'The Walt Disney Company', market: 'us', currency: 'USD' },
  { symbol: 'UBER', name: 'Uber Technologies', market: 'us', currency: 'USD' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', market: 'us', currency: 'USD' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust (Nasdaq 100)', market: 'us', currency: 'USD' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', market: 'us', currency: 'USD' }
];

export const POPULAR_CRYPTO_ASSETS: MarketAsset[] = [
  { symbol: 'BTC', name: 'Bitcoin', market: 'crypto', currency: 'USD' },
  { symbol: 'ETH', name: 'Ethereum', market: 'crypto', currency: 'USD' },
  { symbol: 'SOL', name: 'Solana', market: 'crypto', currency: 'USD' },
  { symbol: 'BNB', name: 'Binance Coin', market: 'crypto', currency: 'USD' },
  { symbol: 'XRP', name: 'XRP (Ripple)', market: 'crypto', currency: 'USD' },
  { symbol: 'DOGE', name: 'Dogecoin', market: 'crypto', currency: 'USD' },
  { symbol: 'ADA', name: 'Cardano', market: 'crypto', currency: 'USD' },
  { symbol: 'AVAX', name: 'Avalanche', market: 'crypto', currency: 'USD' },
  { symbol: 'SUI', name: 'Sui Network', market: 'crypto', currency: 'USD' },
  { symbol: 'LINK', name: 'Chainlink', market: 'crypto', currency: 'USD' },
  { symbol: 'NEAR', name: 'NEAR Protocol', market: 'crypto', currency: 'USD' },
  { symbol: 'DOT', name: 'Polkadot', market: 'crypto', currency: 'USD' }
];

export const MARKET_CONFIGS = {
  bist: {
    id: 'bist',
    labelTr: 'Borsa İstanbul (BIST)',
    labelEn: 'Borsa Istanbul (BIST)',
    descTr: 'BIST hisseleri (THYAO, ASELS vb.) ve TEFAS yatırım fonları',
    descEn: 'Turkish stocks (THYAO, ASELS etc.) and TEFAS mutual funds',
    badge: '🇹🇷 BIST',
    defaultCurrency: 'TRY',
    currencySymbol: '₺'
  },
  us: {
    id: 'us',
    labelTr: 'Amerikan Borsası (US)',
    labelEn: 'US Stocks (NASDAQ / NYSE)',
    descTr: 'ABD teknoloji ve büyüme hisseleri (AAPL, NVDA, MSFT, TSLA)',
    descEn: 'US tech and growth equities (AAPL, NVDA, MSFT, TSLA)',
    badge: '🇺🇸 US',
    defaultCurrency: 'USD',
    currencySymbol: '$'
  },
  crypto: {
    id: 'crypto',
    labelTr: 'Kripto Paralar (Crypto)',
    labelEn: 'Cryptocurrency (Crypto)',
    descTr: 'Bitcoin, Ethereum, Solana ve majör kripto varlıklar',
    descEn: 'Bitcoin, Ethereum, Solana, and major crypto assets',
    badge: '🪙 Crypto',
    defaultCurrency: 'USD',
    currencySymbol: '$'
  }
} as const;
