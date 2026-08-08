# Finans Transfer ve AI Düzeltme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kredi kartı borcunu işlemlerle eşitlemek, kredi kartı hariç hesap transferi eklemek ve Gemini/OpenRouter AI yapılandırmasını çalışır hale getirmek.

**Architecture:** Finans hesap etkileri ortak saf yardımcı fonksiyonlarla tanımlanacak. Server action doğrulama ve MongoDB güncellemelerini yapacak; transfer ayrı bir action ve form olarak hesap yönetimine bağlanacak. AI anahtarları yalnızca server ortamından okunacak ve Gemini başarısızlığında OpenRouter fallback kullanılacak.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Server Actions, Mongoose/MongoDB, Node test runner.

## Global Constraints

- Kredi kartı harcaması `current_debt` değerini işlem tutarı kadar artırır.
- Transfer yalnızca `cash`, `bank_account`, `debit_card` hesapları arasında yapılır.
- Transfer gelir/gider analizlerine dahil edilmez.
- Gemini ana sağlayıcı, OpenRouter yedek sağlayıcıdır.
- API anahtarları kaynak koda veya client bundle'a yazılmaz.
- Mevcut kullanıcı değişiklikleri korunur.

### Task 1: Finans hesap etki kurallarını test edilebilir hale getir

**Files:**
- Create: `src/lib/finance-rules.ts`
- Create: `tests/finance-rules.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces `applyTransactionEffect(account, type, amount)` and `validateTransfer(source, target, amount)` pure functions.

- [ ] **Step 1: Write failing tests** for credit-card expense debt increase, credit-card deletion reversal, valid transfer, and invalid transfer cases.
- [ ] **Step 2: Run `node --test tests/finance-rules.test.mjs` and confirm the expected failures.**
- [ ] **Step 3: Implement the minimal pure rules and add `test` / `test:finance` scripts.
- [ ] **Step 4: Run the focused test and confirm it passes.**

### Task 2: Server finans işlemlerini düzelt

**Files:**
- Modify: `src/models/Enums.ts`
- Modify: `src/models/Transaction.ts`
- Modify: `src/actions/finance.ts`
- Modify: `src/actions/dashboard.ts`
- Test: `tests/finance-rules.test.mjs`

**Interfaces:**
- Produces `transferAccountsAction({ sourceAccountId, targetAccountId, amount, date, description })`.
- Existing add/delete/update transaction actions apply credit-card debt effects.

- [ ] **Step 1: Add `TRANSFER` transaction type and allow its source value in the transaction model.
- [ ] **Step 2: Update add/delete transaction effects so credit-card debt changes together with balance, and use `show_as_expense: false` / `affects_account_balance: true` where appropriate.
- [ ] **Step 3: Implement transfer validation, source/target ownership checks, atomic MongoDB session when available, balance updates, and one related transaction record.
- [ ] **Step 4: Exclude transfer records from monthly income/expense calculations and map transfer labels/related account names in dashboard DTO.
- [ ] **Step 5: Run focused tests, `npm run lint`, and `npm run build`.

### Task 3: Transfer arayüzünü hesap yönetimine ekle

**Files:**
- Create: `src/components/forms/TransferAccountsForm.tsx`
- Modify: `src/components/forms/ManageAccountsForm.tsx`
- Modify: `src/components/dashboard/DashboardSheetManager.tsx`
- Modify: `src/components/dashboard/FinanceSection.tsx`

**Interfaces:**
- Consumes `financeData.accounts` and calls `transferAccountsAction`.
- Produces a transfer sheet opened from the accounts management screen.

- [ ] **Step 1: Add a failing interaction-level check in the existing test setup or a pure form validation test for same-account, credit-card, and insufficient-balance rejection.
- [ ] **Step 2: Implement the transfer form with source/target selects filtered to non-credit accounts, amount/date/description fields, loading state, and toast errors.
- [ ] **Step 3: Add “Para Aktar” button and sheet route/title; refresh dashboard after success.
- [ ] **Step 4: Render transfer history as neutral `TRANSFER` entries without plus/minus income/expense styling or daily net impact.
- [ ] **Step 5: Run lint/build and manually verify all four transfer directions.

### Task 4: AI anahtarlarını ve fallback akışını güncelle

**Files:**
- Modify: `.env.local` (ignored secret file; never commit)
- Modify: `src/app/api/food/gemini/route.ts`
- Modify: `src/actions/assistant.ts`

**Interfaces:**
- Existing food search and voice assistant continue using server-only environment variables.

- [ ] **Step 1: Add provider-selection tests around missing Gemini, Gemini failure, and OpenRouter fallback without embedding real keys.
- [ ] **Step 2: Update local environment values from the user-provided keys without logging or displaying them.
- [ ] **Step 3: Make fallback errors preserve the useful provider failure while returning a safe Turkish message.
- [ ] **Step 4: Verify `/api/food/gemini` and assistant paths compile and lint; use a live request only if local environment/database is available.

### Task 5: Final verification

**Files:**
- Modify: none unless verification exposes a defect.

- [ ] **Step 1: Run `npm run test:finance`.
- [ ] **Step 2: Run `npm run lint`.
- [ ] **Step 3: Run `npm run build`.
- [ ] **Step 4: Review `git diff` and confirm `.env.local` is not staged.
