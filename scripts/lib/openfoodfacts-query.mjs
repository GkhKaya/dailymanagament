const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/api/v2/search';
const DEFAULT_FIELDS = 'code,product_name,product_name_tr,brands,nutriments,serving_size';

export function buildOpenFoodFactsSearchUrl({ category, page = 1, pageSize = 100 } = {}) {
  const params = new URLSearchParams({
    countries_tags_en: 'turkey',
    fields: DEFAULT_FIELDS,
    page_size: String(pageSize),
    page: String(page),
    sort_by: 'unique_scans_n',
  });

  if (category) params.set('categories_tags_en', category);
  return `${OFF_SEARCH_URL}?${params.toString()}`;
}
