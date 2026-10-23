/**
 * Страница «Каталог» в админке, как дерево в Битриксе (решение владельца 23.10.2026): вкладки
 * «Программное обеспечение / Оборудование / Услуги и обучение» → производители-папки → товары.
 * Чистые функции без базы: группы, доступность, сортировка колонок, проверка «Сорт.».
 */

/** Вкладки дерева: значение и подпись. */
export const TREE_GROUPS = /** @type {const} */ ([
  { value: 'software', label: 'Программное обеспечение' },
  { value: 'hardware', label: 'Оборудование' },
  { value: 'service', label: 'Услуги и обучение' },
])

/** @typedef {'software' | 'hardware' | 'service'} TreeGroup */

/** Подписи типа товара в строке. */
export const KIND_LABELS = {
  software: 'Программа',
  hardware: 'Оборудование',
  course: 'Курс',
  service: 'Услуга',
}

/**
 * Вкладка товара по типу: курсы и услуги — вместе.
 * @param {string | null | undefined} kind
 * @returns {TreeGroup}
 */
export function groupOf(kind) {
  if (kind === 'software' || kind === 'hardware') return kind
  return 'service'
}

/** Наибольшее «Сорт.»: Битрикс допускает и большие числа, но 6 знаков с запасом хватает. */
export const SORT_MAX = 999_999

/**
 * Значение из ячейки «Сорт.»: пусто — null, целое 0…999 999 — число, иначе ошибка.
 * @param {string} text
 * @returns {{ ok: true, value: number | null } | { ok: false }}
 */
export function parseSort(text) {
  const clean = text.trim()
  if (clean === '') return { ok: true, value: null }
  if (!/^\d{1,6}$/.test(clean)) return { ok: false }
  return { ok: true, value: Number(clean) }
}

/**
 * Доступность товара в строке дерева. Снятые с производства на сайте скрыты (решение владельца
 * 23.10.2026), модель «из наличия» видна; дальше — есть ли цена.
 * @param {{ research: string | null, priced: boolean, ownPage: boolean }} product
 * @returns {{ label: string, tone: 'ok' | 'muted' | 'warn' }}
 */
export function availability({ research, priced, ownPage }) {
  if (research === 'discontinued') return { label: 'Снят с производства, скрыт', tone: 'warn' }
  if (research === 'in-stock') return { label: 'Из наличия', tone: 'ok' }
  if (!ownPage) return { label: 'Без своей страницы', tone: 'muted' }
  return priced ? { label: 'Цена на сайте', tone: 'ok' } : { label: 'По запросу', tone: 'muted' }
}

/**
 * Сравнение строк по колонке. Пустые значения — всегда в конце, при любом направлении, как
 * неизвестные цены в каталоге. При равенстве — по названию.
 * @template {{ title: string }} T
 * @param {keyof T & string} key
 * @param {'asc' | 'desc'} dir
 * @returns {(a: T, b: T) => number}
 */
export function compareBy(key, dir) {
  const sign = dir === 'asc' ? 1 : -1
  const byTitle = (/** @type {T} */ a, /** @type {T} */ b) =>
    a.title.localeCompare(b.title, 'ru', { numeric: true })
  return (a, b) => {
    const x = /** @type {unknown} */ (a[key])
    const y = /** @type {unknown} */ (b[key])
    const emptyX = x == null || x === ''
    const emptyY = y == null || y === ''
    if (emptyX || emptyY) return Number(emptyX) - Number(emptyY) || byTitle(a, b)
    let result = 0
    if (typeof x === 'number' && typeof y === 'number') result = x - y
    else if (typeof x === 'boolean' && typeof y === 'boolean') result = Number(y) - Number(x)
    else result = String(x).localeCompare(String(y), 'ru', { numeric: true })
    return sign * result || byTitle(a, b)
  }
}
