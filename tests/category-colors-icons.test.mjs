import test from 'node:test';
import assert from 'node:assert';
import { CATEGORY_ICON_LIST, CATEGORY_PALETTE, getCategoryIcon } from '../src/lib/category-icons.ts';

test('1. Category icon list is rich and diverse (at least 50 icons)', () => {
  assert.ok(CATEGORY_ICON_LIST.length >= 50, `Expected at least 50 icons, got ${CATEGORY_ICON_LIST.length}`);
  const uniqueIds = new Set(CATEGORY_ICON_LIST.map(item => item.id));
  assert.strictEqual(uniqueIds.size, CATEGORY_ICON_LIST.length, 'Icon IDs must be unique');
});

test('2. Category palette provides at least 15 rich colors', () => {
  assert.ok(CATEGORY_PALETTE.length >= 15, `Expected at least 15 colors, got ${CATEGORY_PALETTE.length}`);
  CATEGORY_PALETTE.forEach(c => {
    assert.match(c, /^#[0-9a-fA-F]{6}$/, `Color ${c} must be valid 6-char hex`);
  });
});

test('3. getCategoryIcon handles aliases and fallbacks gracefully', () => {
  const iconCart = getCategoryIcon('cart');
  assert.ok(iconCart, 'cart icon should resolve');

  const iconShopping = getCategoryIcon('shopping-bag');
  assert.ok(iconShopping, 'shopping-bag icon should resolve');

  const iconTrending = getCategoryIcon('trending-up');
  assert.ok(iconTrending, 'trending-up alias should resolve');

  const iconTag = getCategoryIcon('tag');
  assert.ok(iconTag, 'tag alias should resolve');

  const fallback = getCategoryIcon('unknown-random-icon-xyz');
  assert.ok(fallback, 'unknown icon should return fallback without crashing');
});
