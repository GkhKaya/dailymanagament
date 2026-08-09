import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTransactionEffect, getCreditCardDebt, validateTransfer } from '../src/lib/finance-rules.ts';

const account = (type, balance, currentDebt = 0, id = undefined) => ({
  id,
  type,
  balance,
  credit_card_details: type === 'credit_card' ? { current_debt: currentDebt } : undefined
});

test('credit card expense increases balance debt together', () => {
  const result = applyTransactionEffect(account('credit_card', -5000, 5000), 'expense', 1000);

  assert.deepEqual(result, { balance: -6000, currentDebt: 6000 });
});

test('reversing a credit card expense restores its debt', () => {
  const result = applyTransactionEffect(account('credit_card', -6000, 6000), 'expense', -1000);

  assert.deepEqual(result, { balance: -5000, currentDebt: 5000 });
});

test('missing credit card debt uses the existing negative card balance', () => {
  assert.equal(getCreditCardDebt({ balance: -5000, credit_card_details: {} }), 5000);
});

test('transfer accepts non-credit accounts with enough balance', () => {
  assert.deepEqual(
    validateTransfer(account('cash', 2500), account('bank_account', 100), 500),
    { valid: true }
  );
});

test('transfer rejects credit cards, same accounts, and insufficient balance', () => {
  assert.deepEqual(validateTransfer(account('credit_card', -5000, 5000), account('cash', 100), 100), {
    valid: false,
    error: 'Kredi kartı transfer için kullanılamaz.'
  });
  assert.deepEqual(validateTransfer(account('cash', 2500, 0, 'same'), account('cash', 2500, 0, 'same'), 100), {
    valid: false,
    error: 'Kaynak ve hedef hesap aynı olamaz.'
  });
  assert.deepEqual(validateTransfer(account('cash', 50), account('bank_account', 100), 100), {
    valid: false,
    error: 'Kaynak hesapta yeterli bakiye yok.'
  });
});
