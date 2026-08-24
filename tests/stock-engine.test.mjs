import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStockPortfolio } from '../src/lib/stock-engine.ts';

test('calculates single buy and partial sell with realized profit', () => {
  const trades = [
    { id: '1', symbol: 'THYAO', type: 'buy', lots: 100, price: 200, date: '2026-01-10T10:00:00Z' },
    { id: '2', symbol: 'THYAO', type: 'sell', lots: 40, price: 250, date: '2026-01-15T10:00:00Z' }
  ];

  const result = calculateStockPortfolio(trades);
  
  // Realized trade check
  assert.equal(result.realizedTrades.length, 1);
  const sellTrade = result.realizedTrades[0];
  assert.equal(sellTrade.lots, 40);
  assert.equal(sellTrade.price, 250);
  assert.equal(sellTrade.cost_basis, 200);
  assert.equal(sellTrade.total_amount, 10000); // 40 * 250
  assert.equal(sellTrade.total_cost, 8000);    // 40 * 200
  assert.equal(sellTrade.realized_pnl, 2000);  // 10000 - 8000
  assert.equal(sellTrade.realized_pnl_percent, 25); // +25%
  assert.equal(sellTrade.holding_days, 5);

  // Open position check
  assert.equal(result.openPositions.length, 1);
  const pos = result.openPositions[0];
  assert.equal(pos.symbol, 'THYAO');
  assert.equal(pos.total_lots, 60);
  assert.equal(pos.average_cost, 200);
  assert.equal(pos.total_cost, 12000);

  // Totals check
  assert.equal(result.totals.totalRealizedPnl, 2000);
  assert.equal(result.totals.winningTradesCount, 1);
  assert.equal(result.totals.losingTradesCount, 0);
  assert.equal(result.totals.winRate, 100);
});

test('calculates staggered buys (weighted average cost) and multiple sells with profit & loss', () => {
  const trades = [
    // 1. Buy 100 @ 100 TL -> Total 100 lots @ 100 TL
    { id: '1', symbol: 'EREGL', type: 'buy', lots: 100, price: 100, date: '2026-01-01T10:00:00Z' },
    // 2. Buy 100 @ 200 TL -> Total 200 lots @ 150 TL avg cost (30,000 TL total cost)
    { id: '2', symbol: 'EREGL', type: 'buy', lots: 100, price: 200, date: '2026-01-05T10:00:00Z' },
    // 3. Sell 50 @ 180 TL -> Cost: 50 * 150 = 7500, Rev: 50 * 180 = 9000 -> PnL: +1500 TL (+20%)
    // Remaining: 150 lots @ 150 TL
    { id: '3', symbol: 'EREGL', type: 'sell', lots: 50, price: 180, date: '2026-01-10T10:00:00Z' },
    // 4. Sell 100 @ 120 TL -> Cost: 100 * 150 = 15000, Rev: 100 * 120 = 12000 -> PnL: -3000 TL (-20%)
    // Remaining: 50 lots @ 150 TL
    { id: '4', symbol: 'EREGL', type: 'sell', lots: 100, price: 120, date: '2026-01-15T10:00:00Z' }
  ];

  const result = calculateStockPortfolio(trades);

  assert.equal(result.realizedTrades.length, 2);
  
  // First sell trade (most recent date first in realizedTrades)
  const sell2 = result.realizedTrades[0]; // 2026-01-15
  assert.equal(sell2.lots, 100);
  assert.equal(sell2.cost_basis, 150);
  assert.equal(sell2.realized_pnl, -3000);
  assert.equal(sell2.realized_pnl_percent, -20);

  const sell1 = result.realizedTrades[1]; // 2026-01-10
  assert.equal(sell1.lots, 50);
  assert.equal(sell1.cost_basis, 150);
  assert.equal(sell1.realized_pnl, 1500);
  assert.equal(sell1.realized_pnl_percent, 20);

  // Overall Realized PnL: +1500 - 3000 = -1500
  assert.equal(result.totals.totalRealizedPnl, -1500);
  assert.equal(result.totals.winningTradesCount, 1);
  assert.equal(result.totals.losingTradesCount, 1);
  assert.equal(result.totals.winRate, 50);

  // Remaining open position
  assert.equal(result.openPositions.length, 1);
  const pos = result.openPositions[0];
  assert.equal(pos.symbol, 'EREGL');
  assert.equal(pos.total_lots, 50);
  assert.equal(pos.average_cost, 150);
  assert.equal(pos.total_cost, 7500);
});

test('handles full position closure and separate stock symbols', () => {
  const trades = [
    { id: '1', symbol: 'ASELS', type: 'buy', lots: 50, price: 60, date: '2026-02-01T10:00:00Z' },
    { id: '2', symbol: 'ASELS', type: 'sell', lots: 50, price: 80, date: '2026-02-05T10:00:00Z' },
    { id: '3', symbol: 'TUPRS', type: 'buy', lots: 20, price: 150, date: '2026-02-02T10:00:00Z' }
  ];

  const result = calculateStockPortfolio(trades);

  assert.equal(result.openPositions.length, 1);
  assert.equal(result.openPositions[0].symbol, 'TUPRS');
  assert.equal(result.openPositions[0].total_lots, 20);

  assert.equal(result.closedPositions.length, 1);
  assert.equal(result.closedPositions[0].symbol, 'ASELS');
  assert.equal(result.closedPositions[0].total_lots, 0);

  assert.equal(result.totals.totalRealizedPnl, 1000); // 50 * (80 - 60)
  assert.equal(result.totals.topProfitableSymbol?.symbol, 'ASELS');
  assert.equal(result.totals.topProfitableSymbol?.pnl, 1000);
});

test('keeps a fund type while calculating its manual-price profit and loss', () => {
  const result = calculateStockPortfolio([
    { id: 'fund-buy', symbol: 'TTE', name: 'Para Piyasası Fonu', assetType: 'fund', type: 'buy', lots: 120, price: 10, date: '2026-08-20' },
  ], { TTE: 11.5 });

  assert.equal(result.openPositions[0].assetType, 'fund');
  assert.equal(result.openPositions[0].unrealized_pnl, 180);
});
