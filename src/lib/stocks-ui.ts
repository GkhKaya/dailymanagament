export type PortfolioTrend = "gain" | "loss" | "neutral";

type RealizedTradeFilter = 'all' | 'stock' | 'fund';
type RealizedPeriodFilter = 'all' | 'week' | 'month';

export function filterRealizedTrades<T extends { assetType: 'stock' | 'fund'; rawDate: string; created_at?: string }>(trades: T[], assetFilter: RealizedTradeFilter, period: RealizedPeriodFilter, now = new Date()) {
  const start = new Date(now);
  if (period === 'week') {
    const dayOfWeek = start.getDay() || 7;
    start.setDate(start.getDate() - dayOfWeek + 1);
    start.setHours(0, 0, 0, 0);
  }
  if (period === 'month') start.setMonth(start.getMonth() - 1);
  return trades
    .filter((trade) => (assetFilter === 'all' || trade.assetType === assetFilter) && (period === 'all' || new Date(trade.rawDate) >= start))
    .sort((a, b) => {
      const timeDiff = new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime();
      if (timeDiff !== 0) return timeDiff;
      const createA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const createB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return createB - createA;
    });
}

export function summarizeRealizedTrades(trades: Array<{ realized_pnl?: number }>) {
  return {
    netPnl: Math.round(trades.reduce((sum, trade) => sum + (trade.realized_pnl || 0), 0) * 100) / 100,
    winningCount: trades.filter((trade) => (trade.realized_pnl || 0) > 0).length,
    losingCount: trades.filter((trade) => (trade.realized_pnl || 0) < 0).length,
  };
}

export function getPortfolioPerformance(currentValue: number, investedCost: number) {
  const pnl = currentValue - investedCost;
  const trend: PortfolioTrend = pnl > 0 ? "gain" : pnl < 0 ? "loss" : "neutral";

  return {
    pnl,
    percent: investedCost > 0 ? (pnl / investedCost) * 100 : 0,
    trend,
  };
}

export function formatStockCurrency(value: number) {
  return `${value.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₺`;
}
