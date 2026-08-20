# Borsa Kâr/Zarar Odaklı Arayüz Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Borsa ekranını kâr/zararı öne çıkaran, mevcut tasarım diliyle uyumlu ve mobilde kolay kullanılan bir portföy görünümüne dönüştürmek.

**Architecture:** Portföy sorgusu, sunucu eylemleri ve modallar korunur. Saf sunum yardımcıları kâr/zarar hesaplamasını tekleştirir; `StocksSection` bunları birincil özet ve sade pozisyon kartlarında kullanır.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Lucide React, Node test runner.

## Global Constraints

- `getStockPortfolioAction` dönüşü ve alış/satış/fiyat/sembol/emir modalları değişmez.
- Mobil varsayılandır; tüm kontroller en az 44px dokunma alanı ve açıklayıcı `aria-label` taşır.
- Mevcut tema tokenları kullanılacak; renk tek başına durum anlamı taşımayacak.
- Son kontrol: UI testi, `npm run test:stocks`, `npm run lint`, `npm run build` ve 375px görsel kontrol.

---

### Task 1: Kâr/Zarar Sunum Yardımcıları

**Files:**
- Create: `src/lib/stocks-ui.ts`
- Create: `tests/stocks-ui.test.mjs`

**Interfaces:** `getPortfolioPerformance(currentValue: number, investedCost: number): { pnl: number; percent: number; trend: "gain" | "loss" | "neutral" }`; `formatStockCurrency(value: number): string`.

- [ ] **Step 1: Write the failing test**

```js
import test from "node:test"; import assert from "node:assert/strict"; import { formatStockCurrency, getPortfolioPerformance } from "../src/lib/stocks-ui.ts";
test("calculates gain and percentage", () => assert.deepEqual(getPortfolioPerformance(1250, 1000), { pnl: 250, percent: 25, trend: "gain" }));
test("formats Turkish stock currency", () => assert.equal(formatStockCurrency(1250.5), "1.250,50 ₺"));
```

- [ ] **Step 2: Run test to verify it fails** — `node --experimental-strip-types --test tests/stocks-ui.test.mjs`; expect missing module failure.

- [ ] **Step 3: Write minimal implementation**

```ts
export function getPortfolioPerformance(currentValue: number, investedCost: number) { const pnl = currentValue - investedCost; return { pnl, percent: investedCost > 0 ? pnl / investedCost * 100 : 0, trend: pnl > 0 ? "gain" : pnl < 0 ? "loss" : "neutral" } as const; }
export function formatStockCurrency(value: number) { return `${value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`; }
```

- [ ] **Step 4: Run test to verify it passes** — repeat the Step 2 command; expect 2 passes.
- [ ] **Step 5: Commit** — `git add src/lib/stocks-ui.ts tests/stocks-ui.test.mjs && git commit -m "test: cover stocks portfolio summary presentation"`.

### Task 2: Kâr/Zarar Özetini Düzenle

**Files:** Modify `src/components/dashboard/StocksSection.tsx`; Test `tests/stocks-ui.test.mjs`.

**Interfaces:** Consumes Task 1 helpers and existing `StockPortfolioDTO`; produces a current-value/realized-P&L primary card plus invested/realized secondary cards.

- [ ] **Step 1: Write the failing test**

```js
test("returns neutral when cost is zero", () => assert.deepEqual(getPortfolioPerformance(0, 0), { pnl: 0, percent: 0, trend: "neutral" }));
```

- [ ] **Step 2: Run test to verify it fails** — test initially classifies a zero result as loss.
- [ ] **Step 3: Write minimal implementation** — import Task 1 helpers; replace the four-card `TOP STATS OVERVIEW CARDS` block with one `PORTFÖY DEĞERİ` primary card showing current value, signed unrealized P&L, signed rate, trend icon and `Artış`/`Düşüş`/`Değişim yok`; add a two-column `YATIRILAN` / `GERÇEKLEŞEN` summary; remove win rate and leader stock.
- [ ] **Step 4: Verify** — `node --experimental-strip-types --test tests/stocks-ui.test.mjs && npm run lint`; expect all green.
- [ ] **Step 5: Commit** — `git add src/components/dashboard/StocksSection.tsx src/lib/stocks-ui.ts tests/stocks-ui.test.mjs && git commit -m "feat: prioritize portfolio profit and loss"`.

### Task 3: Pozisyon Kartlarını Mobil İçin Sadeleştir

**Files:** Modify `src/components/dashboard/StocksSection.tsx`.

**Interfaces:** Consumes existing buy/sell/price/order/symbol/delete handlers; produces compact cards with visible primary actions and native `details` for secondary actions.

- [ ] **Step 1: Implement action hierarchy** — show purchase, sell and current-price actions; put cost-order editing, stock-name editing and deletion under native `details` labelled `Diğer işlemler`.
- [ ] **Step 2: Apply mobile-first layout** — full-width mobile header actions, `min-h-11 w-full` search, short tab labels (`Portföy`, `Kâr/Zarar`, `İşlemler`), `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` positions.
- [ ] **Step 3: Add accessibility and feedback** — label icon-only actions, use `min-h-11`, existing focus ring, token surfaces and 200ms transitions; no hover-only operation.
- [ ] **Step 4: Verify** — `npm run lint && npm run build`; expect exit 0.
- [ ] **Step 5: Commit** — `git add src/components/dashboard/StocksSection.tsx && git commit -m "feat: simplify stocks mobile interactions"`.

### Task 4: Doğrula ve Kaydet

**Files:** Modify this plan.

- [ ] **Step 1: Run domain tests** — `npm run test:stocks && node --experimental-strip-types --test tests/stocks-ui.test.mjs`; expect all pass.
- [ ] **Step 2: Run quality gates** — `npm run lint && npm run build`; expect both exit 0.
- [ ] **Step 3: Visual review** — at 375px verify no overflow, primary P&L first, legible secondary cards, short tabs and 44px targets; desktop uses available width and multi-column positions.
- [ ] **Step 4: Record results and commit** — change completed boxes to `[x]`, record command output, then `git add docs/superpowers/plans/2026-08-20-stocks-profit-loss-ui-plan.md && git commit -m "docs: record stocks ui verification"`.
