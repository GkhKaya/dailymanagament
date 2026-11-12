import test from 'node:test';
import assert from 'node:assert/strict';
import { splitInstallments, chargeDateFor, dueCharges, nextChargeDate } from '../src/lib/installment-rules.ts';

test('1200 in 4 installments is 300 each', () => {
  assert.deepEqual(splitInstallments(1200, 4), [300, 300, 300, 300]);
});

test('rounding remainder goes to the last installment', () => {
  const parts = splitInstallments(1000, 3);
  assert.deepEqual(parts, [333.33, 333.33, 333.34]);
  assert.equal(Math.round(parts.reduce((a, b) => a + b, 0) * 100) / 100, 1000);
});

test('invalid input is rejected', () => {
  assert.throws(() => splitInstallments(0, 3));
  assert.throws(() => splitInstallments(100, 0));
  assert.throws(() => splitInstallments(100, 2.5));
});

test('charge day 31 clamps to short months', () => {
  const first = new Date(2026, 0, 31);
  assert.equal(chargeDateFor(first, 31, 1).getDate(), 28); // Feb 2026
  assert.equal(chargeDateFor(first, 31, 2).getDate(), 31); // Mar
});

test('only charges up to now are due, starting after paid ones', () => {
  const plan = { first_charge_date: new Date(2026, 10, 12), charge_day: 12, paid_count: 0, amounts: [300, 300, 300, 300] };
  const due = dueCharges(plan, new Date(2026, 11, 20));
  assert.deepEqual(due.map((d) => d.index), [0, 1]);
  assert.deepEqual(dueCharges({ ...plan, paid_count: 2 }, new Date(2026, 11, 20)), []);
});

test('first charge today is due immediately', () => {
  const today = new Date(2026, 10, 12, 0, 0);
  const plan = { first_charge_date: today, charge_day: 12, paid_count: 0, amounts: [300, 300] };
  assert.equal(dueCharges(plan, new Date(2026, 10, 12, 9, 30)).length, 1);
});

test('next charge date is null when finished', () => {
  const plan = { first_charge_date: new Date(2026, 10, 12), charge_day: 12, paid_count: 4, amounts: [300, 300, 300, 300] };
  assert.equal(nextChargeDate(plan), null);
  assert.equal(nextChargeDate({ ...plan, paid_count: 1 }).getMonth(), 11);
});
