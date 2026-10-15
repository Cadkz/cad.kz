// @ts-check
// Готовые виды списков в админке (Query Presets Payload): фильтр и колонки одной кнопкой.
// Создаются один раз при сборке (src/lib/presetsSetup.ts) как общие: видят все, менять и удалять —
// администратор. Свои виды маркетолог сохраняет в списке кнопкой «Новый вид списка».

/** @typedef {{ accessor: string, active: boolean }} Column */
/**
 * @typedef {{
 *   title: string,
 *   collection: 'products' | 'offers' | 'publications',
 *   where: Record<string, unknown>[],
 *   columns: string[],
 * }} PresetSeed
 */

const published = { status: { equals: 'published' } }
const draft = { status: { equals: 'draft' } }

/** @type {PresetSeed[]} */
export const PRESETS = [
  {
    title: 'На сайте: заполнены не полностью',
    collection: 'products',
    where: [published, { qualityScore: { less_than: 100 } }],
    columns: ['title', 'qualityScore', 'manufacturer', 'priority', 'status'],
  },
  {
    title: 'На сайте: нет цены или предложений',
    collection: 'products',
    where: [published, { qualityGaps: { in: ['offers', 'price'] } }],
    columns: ['title', 'qualityScore', 'manufacturer', 'mainSection', 'priority'],
  },
  {
    title: 'На сайте: нет картинки',
    collection: 'products',
    where: [published, { qualityGaps: { in: ['image'] } }],
    columns: ['title', 'qualityScore', 'manufacturer', 'mainSection', 'priority'],
  },
  {
    title: 'На сайте: нет описания',
    collection: 'products',
    where: [published, { qualityGaps: { in: ['description', 'summary'] } }],
    columns: ['title', 'qualityScore', 'manufacturer', 'mainSection', 'priority'],
  },
  {
    title: 'Флагманы и топы продаж (у товара)',
    collection: 'products',
    where: [{ priority: { in: ['flagship', 'top'] } }],
    columns: ['title', 'qualityScore', 'manufacturer', 'mainSection', 'priority', 'status'],
  },
  {
    title: 'Черновики',
    collection: 'products',
    where: [draft],
    columns: ['title', 'manufacturer', 'mainSection', 'updatedAt'],
  },
  {
    title: 'На сайте: цена в валюте',
    collection: 'offers',
    where: [published, { currency: { not_equals: 'KZT' } }],
    columns: ['title', 'product', 'amount', 'currency', 'updatedAt'],
  },
  {
    title: 'Без товара',
    collection: 'offers',
    where: [{ product: { exists: false } }],
    columns: ['title', 'configuration', 'amount', 'currency', 'status'],
  },
  {
    title: 'Черновики',
    collection: 'offers',
    where: [draft],
    columns: ['title', 'product', 'amount', 'currency', 'updatedAt'],
  },
  {
    title: 'Акции',
    collection: 'publications',
    where: [{ kind: { equals: 'promotion' } }],
    columns: ['title', 'publishedAt', 'endsAt', 'status'],
  },
  {
    title: 'Новости',
    collection: 'publications',
    where: [{ kind: { equals: 'news' } }],
    columns: ['title', 'theme', 'publishedAt', 'status'],
  },
  {
    title: 'Статьи',
    collection: 'publications',
    where: [{ kind: { equals: 'article' } }],
    columns: ['title', 'theme', 'publishedAt', 'status'],
  },
  {
    title: 'Черновики',
    collection: 'publications',
    where: [draft],
    columns: ['title', 'kind', 'updatedAt'],
  },
  {
    title: 'На сайте: без своей обложки',
    collection: 'publications',
    where: [published, { cover: { exists: false } }],
    columns: ['title', 'kind', 'theme', 'publishedAt'],
  },
]

/**
 * Фильтр в том виде, в каком его сохраняет сам Payload: «или» из одной группы «и».
 * @param {Record<string, unknown>[]} conditions
 */
export function presetWhere(conditions) {
  return { or: [{ and: conditions }] }
}

/**
 * Колонки вида: перечисленные — видны в этом порядке.
 * @param {string[]} accessors
 * @returns {Column[]}
 */
export function presetColumns(accessors) {
  return accessors.map((accessor) => ({ accessor, active: true }))
}
