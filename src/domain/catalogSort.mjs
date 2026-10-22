/** @typedef {'recommended' | 'name' | 'price-asc' | 'price-desc'} CatalogSort */
export const SORT_OPTIONS = [
  { value: 'recommended', label: 'Рекомендуемые' },
  { value: 'name', label: 'По названию: А–Я' },
  { value: 'price-asc', label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' },
]

/** @param {string | null | undefined} value @returns {CatalogSort} */
export function catalogSort(value) {
  return value === 'name' || value === 'price-asc' || value === 'price-desc' ? value : 'recommended'
}

/** Только порядок отображения уже рассчитанных сервером сумм formatKzt, не расчёт цены. */
/** @param {string | null | undefined} formatted */
function amount(formatted) {
  const digits = formatted?.replace(/\s/g, '')
  return digits && /^\d+₸$/.test(digits) ? BigInt(digits.slice(0, -1)) : null
}

const names = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' })
/** @param {CatalogSort} sort */
export function compareCatalog(sort) {
  /** @param {{title: string, priceFrom?: string | null}} a @param {{title: string, priceFrom?: string | null}} b */
  return (a, b) => {
    if (sort === 'name') return names.compare(a.title, b.title)
    const left = amount(a.priceFrom)
    const right = amount(b.priceFrom)
    if (left === null || right === null)
      return left === right ? names.compare(a.title, b.title) : left === null ? 1 : -1
    const delta = left < right ? -1 : left > right ? 1 : 0
    return (sort === 'price-desc' ? -delta : delta) || names.compare(a.title, b.title)
  }
}
