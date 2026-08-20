/**
 * Pure Mathematical Engine for Stock & Order Book Management
 * Handles Weighted Average Cost (WAC / Ağırlıklı Ortalama Maliyet)
 * and Realized Profit / Loss (Gerçekleşen Kâr/Zarar) calculation.
 */

export const POPULAR_BIST_STOCKS: Record<string, string> = {
  THYAO: 'Türk Hava Yolları',
  ASELS: 'Aselsan Elektronik',
  EREGL: 'Ereğli Demir ve Çelik',
  TUPRS: 'Tüpraş Türkiye Petrol',
  KCHOL: 'Koç Holding',
  SISE: 'Türkiye Şişe ve Cam',
  BIMAS: 'BİM Birleşik Mağazalar',
  GARAN: 'Garanti BBVA Bankası',
  AKBNK: 'Akbank',
  ISCTR: 'Türkiye İş Bankası C',
  YKBNK: 'Yapı ve Kredi Bankası',
  SAHOL: 'Hacı Ömer Sabancı Holding',
  FROTO: 'Ford Otosan',
  TOASO: 'Tofaş Türk Otomobil',
  TCELL: 'Turkcell İletişim',
  PGSUS: 'Pegasus Hava Taşımacılığı',
  ENKAI: 'Enka İnşaat',
  KRDMD: 'Kardemir D',
  ASTOR: 'Astor Enerji',
  KONTR: 'Kontrolmatik Teknoloji',
  SASA: 'Sasa Polyester',
  HEKTS: 'Hektaş Ticaret',
  GUBRF: 'Gübre Fabrikaları',
  PETKM: 'Petkim Petrokimya',
  MGROS: 'Migros Ticaret',
  CCOLA: 'Coca-Cola İçecek',
  SOKM: 'Şok Marketler',
  ALARK: 'Alarko Holding',
  DOHOL: 'Doğan Şirketler Grubu',
  TTKOM: 'Türk Telekom',
  EKGYO: 'Emlak Konut GMYO',
  ODAS: 'Odaş Elektrik',
  KOZAL: 'Koza Altın',
  KOZAA: 'Koza Anadolu Metal',
  IPEKE: 'İpek Doğal Enerji',
  VESBE: 'Vestel Beyaz Eşya',
  VESTL: 'Vestel Elektronik',
  ARCLK: 'Arçelik',
  ULKER: 'Ülker Bisküvi',
  MAVI: 'Mavi Giyim',
  TABGD: 'TAB Gıda',
  REEDR: 'Reeder Teknoloji',
  EUPWR: 'Europower Enerji',
  CVKMD: 'CVK Madencilik',
  MIATK: 'Mia Teknoloji',
  AAPL: 'Apple Inc.',
  NVDA: 'NVIDIA Corporation',
  TSLA: 'Tesla, Inc.',
  MSFT: 'Microsoft Corporation',
  AMZN: 'Amazon.com, Inc.',
  GOOGL: 'Alphabet Inc.',
  META: 'Meta Platforms, Inc.'
};

export interface RawTrade {
  _id?: any;
  id?: string;
  symbol: string;
  name?: string;
  type: 'buy' | 'sell';
  lots: number;
  price: number;
  total_amount?: number;
  date: Date | string;
  notes?: string;
  cost_basis?: number;
  total_cost?: number;
  realized_pnl?: number;
  realized_pnl_percent?: number;
  created_at?: Date | string;
}

export interface ComputedTrade extends RawTrade {
  cost_basis: number;
  total_cost: number;
  realized_pnl: number;
  realized_pnl_percent: number;
}

export interface ComputedPosition {
  symbol: string;
  name?: string;
  total_lots: number;
  average_cost: number;
  total_cost: number;
  current_price: number;
  current_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  last_trade_date?: string;
}

export interface PortfolioCalculationResult {
  computedTrades: ComputedTrade[];
  openPositions: ComputedPosition[];
  closedPositions: ComputedPosition[];
  realizedTrades: ComputedTrade[];
  totals: {
    totalInvestedCost: number;
    totalCurrentValue: number;
    totalUnrealizedPnl: number;
    totalUnrealizedPnlPercent: number;
    totalRealizedPnl: number;
    totalRealizedPnlPercent: number;
    winningTradesCount: number;
    losingTradesCount: number;
    winRate: number;
    totalBuyVolume: number;
    totalSellVolume: number;
    topProfitableSymbol?: { symbol: string; pnl: number };
  };
}

/**
 * Calculates running Weighted Average Cost (WAC) and Realized P/L
 * for an array of stock trades for a user.
 */
export function calculateStockPortfolio(
  trades: RawTrade[],
  currentPrices: Record<string, number> = {}
): PortfolioCalculationResult {
  // Sort trades chronologically: date ASC, then created_at ASC
  const sortedTrades = [...trades].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    if (timeA !== timeB) return timeA - timeB;
    const createA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const createB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return createA - createB;
  });

  // Group trades by uppercase symbol
  const tradesBySymbol: Record<string, RawTrade[]> = {};
  for (const trade of sortedTrades) {
    const sym = trade.symbol.trim().toUpperCase();
    if (!tradesBySymbol[sym]) tradesBySymbol[sym] = [];
    tradesBySymbol[sym].push(trade);
  }

  const computedTradesMap = new Map<string | any, ComputedTrade>();
  const openPositions: ComputedPosition[] = [];
  const closedPositions: ComputedPosition[] = [];

  let totalBuyVolume = 0;
  let totalSellVolume = 0;
  let totalCostOfSoldLots = 0;

  const symbolRealizedPnlMap: Record<string, number> = {};

  // Process each symbol independently
  for (const [symbol, symTrades] of Object.entries(tradesBySymbol)) {
    let currentLots = 0;
    let totalInvestedCost = 0;
    let symbolLastName = '';
    let lastTradeDate: string | undefined;

    for (const trade of symTrades) {
      const lots = Number(trade.lots) || 0;
      const price = Number(trade.price) || 0;
      const tradeAmount = lots * price;
      if (trade.name) symbolLastName = trade.name;
      lastTradeDate = new Date(trade.date).toISOString();

      let costBasis = 0;
      let totalCost = 0;
      let realizedPnl = 0;
      let realizedPnlPercent = 0;

      if (trade.type === 'buy') {
        totalBuyVolume += tradeAmount;
        currentLots += lots;
        totalInvestedCost += tradeAmount;

        costBasis = price;
        totalCost = tradeAmount;
      } else if (trade.type === 'sell') {
        totalSellVolume += tradeAmount;
        const avgCost = currentLots > 0 ? totalInvestedCost / currentLots : 0;
        costBasis = Math.round(avgCost * 10000) / 10000;
        totalCost = Math.round(lots * avgCost * 100) / 100;
        totalCostOfSoldLots += totalCost;

        realizedPnl = Math.round((tradeAmount - totalCost) * 100) / 100;
        realizedPnlPercent = avgCost > 0 
          ? Math.round(((price - avgCost) / avgCost) * 10000) / 100 
          : 0;

        currentLots = Math.max(0, currentLots - lots);
        // After sell, the remaining cost basis reduces proportionally
        totalInvestedCost = currentLots * avgCost;

        symbolRealizedPnlMap[symbol] = (symbolRealizedPnlMap[symbol] || 0) + realizedPnl;
      }

      const computed: ComputedTrade = {
        ...trade,
        symbol,
        name: symbolLastName || trade.name,
        lots,
        price,
        total_amount: Math.round(tradeAmount * 100) / 100,
        cost_basis: costBasis,
        total_cost: totalCost,
        realized_pnl: realizedPnl,
        realized_pnl_percent: realizedPnlPercent,
      };

      computedTradesMap.set(trade._id || trade.id || `${symbol}-${trade.date}-${trade.type}-${lots}`, computed);
    }

    const avgUnitCost = currentLots > 0 ? totalInvestedCost / currentLots : 0;
    const roundedAvgCost = Math.round(avgUnitCost * 10000) / 10000;
    const roundedTotalCost = Math.round(totalInvestedCost * 100) / 100;

    const curPrice = currentPrices[symbol] || 0;
    const curValue = curPrice > 0 ? Math.round(currentLots * curPrice * 100) / 100 : roundedTotalCost;
    const unrealizedPnl = curPrice > 0 ? Math.round((curValue - roundedTotalCost) * 100) / 100 : 0;
    const unrealizedPnlPercent = curPrice > 0 && roundedTotalCost > 0
      ? Math.round(((curValue - roundedTotalCost) / roundedTotalCost) * 10000) / 100
      : 0;

    const positionObj: ComputedPosition = {
      symbol,
      name: symbolLastName,
      total_lots: Math.round(currentLots * 10000) / 10000,
      average_cost: roundedAvgCost,
      total_cost: roundedTotalCost,
      current_price: curPrice,
      current_value: curValue,
      unrealized_pnl: unrealizedPnl,
      unrealized_pnl_percent: unrealizedPnlPercent,
      last_trade_date: lastTradeDate,
    };

    if (currentLots > 0) {
      openPositions.push(positionObj);
    } else {
      closedPositions.push(positionObj);
    }
  }

  // Preserve order for computed trades
  const computedTrades: ComputedTrade[] = [];
  for (const trade of sortedTrades) {
    const key = trade._id || trade.id || `${trade.symbol.toUpperCase()}-${trade.date}-${trade.type}-${trade.lots}`;
    const computed = computedTradesMap.get(key);
    if (computed) {
      computedTrades.push(computed);
    }
  }

  // Realized sells list sorted by date DESC
  const realizedTrades = computedTrades
    .filter((t) => t.type === 'sell')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Aggregate totals
  const totalInvestedCost = openPositions.reduce((sum, p) => sum + p.total_cost, 0);
  const totalCurrentValue = openPositions.reduce((sum, p) => sum + (p.current_price > 0 ? p.current_value : p.total_cost), 0);
  const totalUnrealizedPnl = openPositions.reduce((sum, p) => sum + p.unrealized_pnl, 0);
  const totalUnrealizedPnlPercent = totalInvestedCost > 0 
    ? Math.round((totalUnrealizedPnl / totalInvestedCost) * 10000) / 100 
    : 0;

  const totalRealizedPnl = realizedTrades.reduce((sum, t) => sum + (t.realized_pnl || 0), 0);
  const totalRealizedPnlPercent = totalCostOfSoldLots > 0
    ? Math.round((totalRealizedPnl / totalCostOfSoldLots) * 10000) / 100
    : 0;

  const winningTradesCount = realizedTrades.filter((t) => (t.realized_pnl || 0) > 0).length;
  const losingTradesCount = realizedTrades.filter((t) => (t.realized_pnl || 0) < 0).length;
  const totalSellCount = realizedTrades.length;
  const winRate = totalSellCount > 0 ? Math.round((winningTradesCount / totalSellCount) * 1000) / 10 : 0;

  // Find top profitable symbol
  let topProfitableSymbol: { symbol: string; pnl: number } | undefined;
  for (const [sym, pnl] of Object.entries(symbolRealizedPnlMap)) {
    if (!topProfitableSymbol || pnl > topProfitableSymbol.pnl) {
      topProfitableSymbol = { symbol: sym, pnl: Math.round(pnl * 100) / 100 };
    }
  }

  return {
    computedTrades,
    openPositions: openPositions.sort((a, b) => b.total_cost - a.total_cost),
    closedPositions: closedPositions.sort((a, b) => a.symbol.localeCompare(b.symbol)),
    realizedTrades,
    totals: {
      totalInvestedCost: Math.round(totalInvestedCost * 100) / 100,
      totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
      totalUnrealizedPnl: Math.round(totalUnrealizedPnl * 100) / 100,
      totalUnrealizedPnlPercent,
      totalRealizedPnl: Math.round(totalRealizedPnl * 100) / 100,
      totalRealizedPnlPercent,
      winningTradesCount,
      losingTradesCount,
      winRate,
      totalBuyVolume: Math.round(totalBuyVolume * 100) / 100,
      totalSellVolume: Math.round(totalSellVolume * 100) / 100,
      topProfitableSymbol: topProfitableSymbol && topProfitableSymbol.pnl > 0 ? topProfitableSymbol : undefined,
    },
  };
}
