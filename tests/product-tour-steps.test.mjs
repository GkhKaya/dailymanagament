import test from 'node:test';
import assert from 'node:assert/strict';
import { productTourSteps } from '../src/components/onboarding/product-tour-steps.ts';

test('guides first-time users through the actual DailyM areas', () => {
  assert.deepEqual(
    productTourSteps.map((step) => step.target),
    [
      'nav-overview',
      'health-add-meal',
      'finance-add-transaction',
      'stocks-buy',
      'stocks-sell',
      'profile',
      'quick-add',
    ],
  );
});

test('explains that stock records are entered manually by the user', () => {
  const stockStep = productTourSteps.find((step) => step.target === 'stocks-buy');

  assert.match(stockStep.text, /kodunu ve adını sen girersin/i);
  assert.match(stockStep.text, /alış fiyatını ve lotunu/i);
});
