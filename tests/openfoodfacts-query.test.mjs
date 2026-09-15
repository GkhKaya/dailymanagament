import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOpenFoodFactsSearchUrl } from '../scripts/lib/openfoodfacts-query.mjs';

test('builds a Turkey-only ice cream catalog query', () => {
  const url = new URL(buildOpenFoodFactsSearchUrl({ category: 'ice-creams', page: 3, pageSize: 100 }));

  assert.equal(url.searchParams.get('countries_tags_en'), 'turkey');
  assert.equal(url.searchParams.get('categories_tags_en'), 'ice-creams');
  assert.equal(url.searchParams.get('page'), '3');
  assert.equal(url.searchParams.get('page_size'), '100');
});
