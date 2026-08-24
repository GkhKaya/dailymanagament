import test from "node:test";
import assert from "node:assert/strict";
import { formatStockCurrency, getPortfolioPerformance, filterRealizedTrades, summarizeRealizedTrades } from "../src/lib/stocks-ui.ts";

test("calculates the current unrealized portfolio gain and percentage", () => {
  assert.deepEqual(getPortfolioPerformance(1250, 1000), {
    pnl: 250,
    percent: 25,
    trend: "gain",
  });
});

test("formats stock money with Turkish currency notation", () => {
  assert.equal(formatStockCurrency(1250.5), "1.250,50 ₺");
});

test("filters realized trades by asset type and period", () => {
  const trades = [
    { id: '1', symbol: 'AAA', assetType: 'stock', rawDate: '2026-08-20T10:00:00.000Z', realized_pnl: 100 },
    { id: '2', symbol: 'TTE', assetType: 'fund', rawDate: '2026-08-19T10:00:00.000Z', realized_pnl: -25 },
    { id: '3', symbol: 'OLD', assetType: 'stock', rawDate: '2026-07-01T10:00:00.000Z', realized_pnl: 500 },
  ];
  const result = filterRealizedTrades(trades, 'fund', 'month', new Date('2026-08-21T12:00:00.000Z'));
  assert.deepEqual(result.map((trade) => trade.id), ['2']);
  assert.deepEqual(summarizeRealizedTrades(result), { netPnl: -25, winningCount: 0, losingCount: 1 });
});

test("weekly filter starts on Monday instead of rolling seven days", () => {
  const trades = [
    { id: 'current-week', assetType: 'stock', rawDate: '2026-08-24T10:00:00.000Z', realized_pnl: 100 },
    { id: 'previous-week', assetType: 'stock', rawDate: '2026-08-21T10:00:00.000Z', realized_pnl: -25 },
  ];
  const result = filterRealizedTrades(trades, 'all', 'week', new Date('2026-08-24T12:00:00.000Z'));
  assert.deepEqual(result.map((trade) => trade.id), ['current-week']);
});
