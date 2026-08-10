import test from 'node:test';
import assert from 'node:assert/strict';
import { TURKEY_PROVINCES } from '../src/lib/turkey-locations.ts';

test('provides all 81 Turkish provinces', () => {
  assert.equal(TURKEY_PROVINCES.length, 81);
  assert.ok(TURKEY_PROVINCES.includes('Adana'));
  assert.ok(TURKEY_PROVINCES.includes('Zonguldak'));
});
