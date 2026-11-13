import test from 'node:test';
import assert from 'node:assert/strict';
import { debtFlow, signedAmount, applyDebtPayment, remainingAfterEdit } from '../src/lib/debt-rules.ts';

test('lending sends money out, repayment from friend brings it in', () => {
  assert.equal(debtFlow('given', 'open'), 'out');
  assert.equal(debtFlow('given', 'payment'), 'in');
});

test('borrowing brings money in, paying it back sends it out', () => {
  assert.equal(debtFlow('taken', 'open'), 'in');
  assert.equal(debtFlow('taken', 'payment'), 'out');
});

test('signed amount follows the flow', () => {
  assert.equal(signedAmount('in', 250), 250);
  assert.equal(signedAmount('out', 250), -250);
});

test('partial payments reduce the remaining amount and close at zero', () => {
  assert.deepEqual(applyDebtPayment(1000, 300), { remaining: 700, status: 'partially_paid' });
  assert.deepEqual(applyDebtPayment(700, 700), { remaining: 0, status: 'closed' });
});

test('overpaying or zero payments are rejected', () => {
  assert.throws(() => applyDebtPayment(500, 600));
  assert.throws(() => applyDebtPayment(500, 0));
});

test('editing the original amount keeps payments made', () => {
  assert.equal(remainingAfterEdit(1200, 300), 900);
  assert.equal(remainingAfterEdit(200, 300), 0);
});
