import test from 'node:test';
import assert from 'node:assert/strict';
import { productTourSteps } from '../src/components/onboarding/product-tour-steps.ts';

test('guides first-time users through the actual DailyM areas', () => {
  const targets = productTourSteps.map((step) => step.target);
  assert.ok(targets.includes('nav-overview'));
  assert.ok(targets.includes('health-add-meal'));
  assert.ok(targets.includes('stocks-buy'));
  assert.ok(targets.includes('stocks-sell'));
  assert.ok(targets.includes('profile'));
  assert.ok(targets.includes('voice-assistant'), 'Tour must include voice-assistant step');
});

test('explains that stock records are entered manually by the user', () => {
  const stockStep = productTourSteps.find((step) => step.target === 'stocks-buy');

  assert.ok(stockStep, 'stocks-buy step must exist');
  assert.match(stockStep.text, /Alış Emri Gir/i);
  assert.match(stockStep.text, /ortalama maliyet/i);
});

test('explains AI voice assistant logging', () => {
  const voiceStep = productTourSteps.find((step) => step.target === 'voice-assistant');

  assert.ok(voiceStep, 'voice-assistant step must exist');
  assert.match(voiceStep.title, /Sesli Asistan/i);
  assert.match(voiceStep.text, /mikrofon/i);
});
