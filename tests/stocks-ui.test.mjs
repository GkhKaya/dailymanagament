import test from "node:test";
import assert from "node:assert/strict";
import { formatStockCurrency, getPortfolioPerformance } from "../src/lib/stocks-ui.ts";

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
