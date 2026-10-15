// @ts-check
// Очередь работы на главной админки: что требует внимания. Чистые функции без базы,
// данные собирает src/lib/adminHome.ts. Тесты — tests/adminQueue.test.mjs.

const DAY = 86_400_000

/** Сколько дней акция без даты окончания считается действующей (тот же признак на сайте). */
export const PROMO_FRESH_DAYS = 180

/** Сколько дней вперёд смотреть на заканчивающиеся акции. */
export const PROMO_SOON_DAYS = 7

/**
 * Когда акция перестаёт быть действующей: «Акция действует до» или полгода от начала показа.
 * @param {{ endsAt?: string | null, publishedAt?: string | null }} promo
 * @returns {Date | null}
 */
export function promoEnd(promo) {
  if (promo.endsAt) return new Date(promo.endsAt)
  if (promo.publishedAt)
    return new Date(new Date(promo.publishedAt).getTime() + PROMO_FRESH_DAYS * DAY)
  return null
}

/**
 * Акции, которые закончатся в ближайшие дни (сегодня включительно), — ближайшие первыми.
 * daysLeft: 0 — сегодня последний день, 1 — завтра.
 * @template {{ endsAt?: string | null, publishedAt?: string | null }} T
 * @param {T[]} promos
 * @param {Date} now
 * @param {number} [days]
 * @returns {(T & { end: Date, daysLeft: number })[]}
 */
export function promosEndingSoon(promos, now, days = PROMO_SOON_DAYS) {
  // Сутки по Казахстану (UTC+5): «сегодня» начинается в 00:00 по Астане.
  const shift = 5 * 3_600_000
  const today = Math.floor((now.getTime() + shift) / DAY)
  return promos
    .map((promo) => ({ promo, end: promoEnd(promo) }))
    .filter(/** @returns {x is { promo: T, end: Date }} */ (x) => x.end !== null)
    .map(({ promo, end }) => ({
      ...promo,
      end,
      daysLeft: Math.floor((end.getTime() + shift) / DAY) - today,
    }))
    .filter(({ daysLeft }) => daysLeft >= 0 && daysLeft <= days)
    .sort((a, b) => a.end.getTime() - b.end.getTime())
}

/**
 * «сегодня последний день», «до завтра», «ещё 3 дня».
 * @param {number} daysLeft
 */
export function daysLeftText(daysLeft) {
  if (daysLeft <= 0) return 'сегодня последний день'
  if (daysLeft === 1) return 'до завтра'
  const n10 = daysLeft % 10
  const n100 = daysLeft % 100
  const word =
    n10 === 1 && n100 !== 11
      ? 'день'
      : n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)
        ? 'дня'
        : 'дней'
  return `ещё ${daysLeft} ${word}`
}

/** Чего не хватает карточке товара. Порядок — порядок групп на главной админки. */
export const GAPS = /** @type {const} */ (['offers', 'price', 'image', 'description'])

/** @typedef {typeof GAPS[number]} Gap */

/** @type {Record<Gap, string>} */
export const GAP_LABELS = {
  offers: 'Нет предложений',
  price: 'Нет цены',
  image: 'Нет картинки',
  description: 'Нет описания',
}

/** @type {Record<Gap, string>} */
export const GAP_HINTS = {
  offers: 'Покупателю нечего выбрать: добавьте предложение (комплектацию и лицензию).',
  price: 'На сайте кнопка «Запросить цену» вместо корзины. Цены — загрузкой прайса.',
  image: 'Своей галереи нет: на сайте картинка производителя или значок раздела.',
  description: 'На странице товара пустой блок «О программе».',
}

/**
 * Недостатки опубликованной карточки. Цена нужна только там, где покупают корзиной
 * (стандартная лицензия и продление); у оборудования и корпоративного ПО — «Запросить цену».
 * @param {{ offers: number, priced: number, hasImage: boolean, hasDescription: boolean, needsPrice: boolean }} card
 * @returns {Gap[]}
 */
export function productGaps(card) {
  /** @type {Gap[]} */
  const gaps = []
  if (card.offers === 0) gaps.push('offers')
  else if (card.priced === 0 && card.needsPrice) gaps.push('price')
  if (!card.hasImage) gaps.push('image')
  if (!card.hasDescription) gaps.push('description')
  return gaps
}

const LEVEL_RANK = { flagship: 0, top: 1, normal: 2, low: 3 }

/**
 * Порядок в списке недостатков: сначала флагманы и топы продаж — их чинить первыми.
 * @param {string | null | undefined} level
 */
export function levelRank(level) {
  return LEVEL_RANK[/** @type {keyof typeof LEVEL_RANK} */ (level ?? 'normal')] ?? 2
}
