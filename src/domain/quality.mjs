// @ts-check
// Заполненность карточки товара: что проверяем, как считаем процент и как пишем, чего не хватает.
// Чистые функции без базы: данные собирает src/lib/productQuality.ts. Тесты — tests/quality.test.mjs.

import { productGaps } from './adminQueue.mjs'

/**
 * Проверки карточки товара в порядке важности. Первые четыре — те же, что «Неполные карточки» на
 * главной админки; короткое описание и раздел — только в «Контроле качества» и в списке товаров.
 */
export const CHECKS = /** @type {const} */ ([
  'offers',
  'price',
  'image',
  'description',
  'summary',
  'section',
])

/** @typedef {typeof CHECKS[number]} Check */

/** Название недостатка: «Нет картинки». @type {Record<Check, string>} */
export const CHECK_LABELS = {
  offers: 'Нет предложений',
  price: 'Нет цены',
  image: 'Нет картинки',
  description: 'Нет описания',
  summary: 'Нет короткого описания',
  section: 'Нет раздела',
}

/** Чего не хватает — для строки в списке: «нет картинки, описания». @type {Record<Check, string>} */
export const CHECK_SHORT = {
  offers: 'предложений',
  price: 'цены',
  image: 'картинки',
  description: 'описания',
  summary: 'короткого описания',
  section: 'раздела',
}

/** Что видит покупатель и как исправить. @type {Record<Check, string>} */
export const CHECK_HINTS = {
  offers: 'Покупателю нечего выбрать: добавьте предложение (комплектацию и лицензию).',
  price: 'На сайте кнопка «Запросить цену» вместо корзины. Цены — загрузкой прайса.',
  image: 'Своей галереи нет: на сайте картинка производителя или значок раздела.',
  description: 'На странице товара пустой блок «О программе».',
  summary:
    'В карточке каталога нет строки под названием, в поиске Google и Яндекса — описание из ' +
    'случайного текста. Заполните «Коротко для карточки» (1–2 предложения).',
  section: 'Товар не виден ни в одном разделе каталога: найти его можно только поиском.',
}

/**
 * @typedef {{
 *   offers: number,
 *   priced: number,
 *   hasImage: boolean,
 *   hasDescription: boolean,
 *   needsPrice: boolean,
 *   hasSummary: boolean,
 *   hasSection: boolean,
 * }} QualityInput
 */

/**
 * Недостатки карточки и процент заполненности. Цена не считается недостатком там, где её не
 * показывают (оборудование и корпоративное ПО — «Запросить цену»), и когда нет самих предложений.
 * @param {QualityInput} card
 * @returns {{ gaps: Check[], score: number }}
 */
export function productQuality(card) {
  /** @type {Check[]} */
  const gaps = [...productGaps(card)]
  if (!card.hasSummary) gaps.push('summary')
  if (!card.hasSection) gaps.push('section')
  gaps.sort((a, b) => CHECKS.indexOf(a) - CHECKS.indexOf(b))
  // Где цену не показывают, проверок пять. Без предложений нет и цены: это две непройденные.
  const total = card.needsPrice ? CHECKS.length : CHECKS.length - 1
  const failed = gaps.length + (card.needsPrice && gaps.includes('offers') ? 1 : 0)
  return { gaps, score: Math.floor(((total - failed) * 100) / total) }
}

/**
 * Строка для списка товаров: «Всё заполнено» или «Нет картинки, описания».
 * @param {readonly string[] | null | undefined} gaps
 */
export function qualityText(gaps) {
  const known = (gaps ?? []).filter(
    /** @returns {gap is Check} */ (gap) => CHECKS.includes(/** @type {Check} */ (gap)),
  )
  if (!known.length) return 'Всё заполнено'
  const [first, ...rest] = known
  if (!rest.length) return CHECK_LABELS[first]
  return `Нет ${[first, ...rest].map((gap) => CHECK_SHORT[gap]).join(', ')}`
}

/**
 * Оценка заполненности для цвета отметки: полная, почти (одна-две мелочи), мало.
 * @param {number | null | undefined} score
 * @returns {'full' | 'part' | 'low' | 'none'}
 */
export function qualityLevel(score) {
  if (score == null) return 'none'
  if (score >= 100) return 'full'
  if (score >= 60) return 'part'
  return 'low'
}
