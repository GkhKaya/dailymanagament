export type PortfolioTrend = "gain" | "loss" | "neutral";

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
