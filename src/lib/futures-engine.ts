export interface ComputeTradePnlParams {
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  leverage: number;
  size?: number;
  margin?: number;
}

export interface ComputedTradePnl {
  pnl: number;
  pnlPercent: number; // ROI %
}

/**
 * Calculates realized or unrealized PnL and ROI (%) for Long/Short leveraged positions.
 */
export function calculateFuturesPnl({
  side,
  entryPrice,
  exitPrice,
  leverage,
  size,
  margin
}: ComputeTradePnlParams): ComputedTradePnl {
  if (entryPrice <= 0 || exitPrice < 0) {
    return { pnl: 0, pnlPercent: 0 };
  }

  const effectiveLeverage = Math.max(1, leverage || 1);
  const effectiveMargin = margin && margin > 0 ? margin : (size ? size / effectiveLeverage : 0);
  const effectiveSize = size && size > 0 ? size : effectiveMargin * effectiveLeverage;

  const priceRatio = side === 'long' 
    ? (exitPrice - entryPrice) / entryPrice 
    : (entryPrice - exitPrice) / entryPrice;

  // ROI (%) = price movement ratio * leverage * 100
  const pnlPercent = Number((priceRatio * effectiveLeverage * 100).toFixed(2));

  // Dollar / Currency PnL = price movement ratio * position size
  const pnl = Number((priceRatio * effectiveSize).toFixed(2));

  return { pnl, pnlPercent };
}

export interface FuturesSummaryMetrics {
  totalRealizedPnl: number;
  openPositionsCount: number;
  totalActiveMargin: number;
  closedTradesCount: number;
  winningTradesCount: number;
  losingTradesCount: number;
  winRate: number;
  longCount: number;
  shortCount: number;
}

/**
 * Calculates summary metrics for a list of futures trades.
 */
export function calculateFuturesSummary(trades: Array<{
  status: 'open' | 'closed' | 'limit';
  side: 'long' | 'short';
  margin: number;
  pnl?: number;
}>): FuturesSummaryMetrics {
  let totalRealizedPnl = 0;
  let openPositionsCount = 0;
  let totalActiveMargin = 0;
  let closedTradesCount = 0;
  let winningTradesCount = 0;
  let losingTradesCount = 0;
  let longCount = 0;
  let shortCount = 0;

  for (const t of trades) {
    if (t.side === 'long') longCount++;
    if (t.side === 'short') shortCount++;

    if (t.status === 'open') {
      openPositionsCount++;
      totalActiveMargin += t.margin || 0;
    } else if (t.status === 'closed') {
      closedTradesCount++;
      const pnl = t.pnl || 0;
      totalRealizedPnl += pnl;
      if (pnl > 0) {
        winningTradesCount++;
      } else if (pnl < 0) {
        losingTradesCount++;
      }
    }
  }

  const winRate = closedTradesCount > 0 
    ? Number(((winningTradesCount / closedTradesCount) * 100).toFixed(1)) 
    : 0;

  return {
    totalRealizedPnl: Number(totalRealizedPnl.toFixed(2)),
    openPositionsCount,
    totalActiveMargin: Number(totalActiveMargin.toFixed(2)),
    closedTradesCount,
    winningTradesCount,
    losingTradesCount,
    winRate,
    longCount,
    shortCount
  };
}
