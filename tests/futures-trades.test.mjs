import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFuturesPnl, calculateFuturesSummary } from '../src/lib/futures-engine.ts';

test('LONG trade: calculates positive PnL and ROI when price goes up', () => {
  // Entry: 100, Exit: 110 (+10%), Leverage: 10x, Margin: 100$, Size: 1000$
  const res = calculateFuturesPnl({
    side: 'long',
    entryPrice: 100,
    exitPrice: 110,
    leverage: 10,
    margin: 100,
    size: 1000
  });

  // Price movement = +10%. With 10x leverage, ROI = +100%. PnL = +100$
  assert.equal(res.pnlPercent, 100);
  assert.equal(res.pnl, 100);
});

test('LONG trade: calculates negative PnL and ROI when price drops', () => {
  // Entry: 50, Exit: 45 (-10%), Leverage: 5x, Margin: 200$, Size: 1000$
  const res = calculateFuturesPnl({
    side: 'long',
    entryPrice: 50,
    exitPrice: 45,
    leverage: 5,
    margin: 200,
    size: 1000
  });

  // Price movement = -10%. With 5x leverage, ROI = -50%. PnL = -100$
  assert.equal(res.pnlPercent, -50);
  assert.equal(res.pnl, -100);
});

test('SHORT trade: calculates positive PnL and ROI when price drops', () => {
  // Entry: 100, Exit: 90 (-10% price drop), Leverage: 10x, Margin: 100$, Size: 1000$
  const res = calculateFuturesPnl({
    side: 'short',
    entryPrice: 100,
    exitPrice: 90,
    leverage: 10,
    margin: 100,
    size: 1000
  });

  // For SHORT, drop is profit! ROI = +100%, PnL = +100$
  assert.equal(res.pnlPercent, 100);
  assert.equal(res.pnl, 100);
});

test('SHORT trade: calculates negative PnL and ROI when price rises', () => {
  // Entry: 100, Exit: 105 (+5% price rise), Leverage: 20x, Margin: 50$, Size: 1000$
  const res = calculateFuturesPnl({
    side: 'short',
    entryPrice: 100,
    exitPrice: 105,
    leverage: 20,
    margin: 50,
    size: 1000
  });

  // Price rose by 5%, with 20x leverage on short, ROI = -100%, PnL = -50$
  assert.equal(res.pnlPercent, -100);
  assert.equal(res.pnl, -50);
});

test('calculates summary metrics, win rate, and active margin correctly', () => {
  const trades = [
    { status: 'open', side: 'long', margin: 500 },
    { status: 'open', side: 'short', margin: 250 },
    { status: 'closed', side: 'long', margin: 100, pnl: 80 },
    { status: 'closed', side: 'short', margin: 100, pnl: 40 },
    { status: 'closed', side: 'long', margin: 100, pnl: -60 }
  ];

  const summary = calculateFuturesSummary(trades);

  assert.equal(summary.openPositionsCount, 2);
  assert.equal(summary.totalActiveMargin, 750);
  assert.equal(summary.closedTradesCount, 3);
  assert.equal(summary.winningTradesCount, 2);
  assert.equal(summary.losingTradesCount, 1);
  assert.equal(summary.totalRealizedPnl, 60); // 80 + 40 - 60 = 60
  assert.equal(summary.winRate, 66.7); // 2 / 3 = 66.7%
  assert.equal(summary.longCount, 3);
  assert.equal(summary.shortCount, 2);
});
