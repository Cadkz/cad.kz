// Запись каталога из Битрикса в базу сайта (Payload). Берёт результат buildCatalog и
// создаёт или обновляет записи по ключу импорта legacyKey. Повторный запуск обновляет то, что
// изменилось в Битриксе, и ничего не удаляет: пропавшее из выгрузки снимается с публикации.
//
// Что импорт не трогает у уже существующих записей: публикацию, разделы и направления, задачи,
// частые вопросы, рекомендации и галерею, если в ней уже что-то есть. Это правит редактор.
//
// Запись разбита на шаги (startImport → writeProducts → writeOffers → finishImport), чтобы
// страница импорта в админке могла выполнять её частями: у функции на хостинге лимит времени.

/** Курсы старого сайта, подтверждённые владельцем 08.10.2026 (USD и EUR по 550 — так задумано). */
export const IMPORT_RATES = { USD: '550', EUR: '550', RUB: '6' }

/** Старый сайт: оттуда берутся картинки товаров. */
export const OLD_SITE = 'https://cad.kz'

/** Подпись варианта, у которого в Битриксе нет отдельной комплектации. */
export const BASE_CONFIGURATION = 'Базовая'

const PRODUCT_PRICE_PREFIX = 'bitrix:product-price:'
const manufacturerKey = (name) => `bitrix:manufacturer:${name.toLowerCase()}`
const isBitrix = (doc) => String(doc.legacyKey ?? '').startsWith('bitrix:')
const isDemo = (doc) => String(doc.legacyKey ?? '').startsWith('demo:')

/** Символьный код Битрикса годится для адреса как есть; иначе — латиница, цифры, «-» и «_». */
export function productSlug(code, bitrixId) {
  const slug = String(code ?? '')
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || `bx-${bitrixId}`
}

/**
 * @typedef {object} PlannedProduct
 * @property {string} legacyKey
 * @property {string} bitrixId
 * @property {string} slug
 * @property {string | null} manufacturer
 * @property {string[]} images
 * @property {{ title: string, kind: string, summary: string | null, description: string | null, properties: { name: string, value: string }[] }} data
 * @typedef {object} PlannedOffer
 * @property {string} legacyKey
 * @property {string} productLegacyKey
 * @property {{ title: string, configuration: string, license: string, amount: string, currency: string, includesVat: boolean, sourceVat: string }} data
 * @typedef {{ manufacturers: string[], products: PlannedProduct[], offers: PlannedOffer[] }} Plan
 */

/**
 * Что и в каком виде будет записано в базу. Без базы: удобно проверять тестами.
 * @param {Pick<import('./bitrixCatalog.mjs').Catalog, 'products' | 'offers'>} catalog
 * @returns {Plan}
 */
export function planImport({ products, offers }) {
  const manufacturers = [...new Set(products.map((p) => p.manufacturer).filter(Boolean))]
  const plannedProducts = products.map((p) => ({
    legacyKey: p.legacyKey,
    bitrixId: p.bitrixId,
    slug: productSlug(p.slug, p.bitrixId),
    manufacturer: p.manufacturer,
    images: p.images,
    data: {
      title: p.title,
      kind: p.kind,
      summary: p.summary,
      description: p.description,
      properties: p.properties,
    },
  }))

  const offerData = (title, configuration, license, price) => ({
    title,
    configuration,
    license,
    amount: price.amount,
    currency: price.currency,
    includesVat: price.includesVat,
    sourceVat: price.sourceVat,
  })
  const plannedOffers = offers
    .filter((o) => o.price)
    .map((o) => ({
      legacyKey: o.legacyKey,
      productLegacyKey: o.productLegacyKey,
      data: offerData(o.title, o.configuration, o.license, o.price),
    }))
  // Простой товар без предложений: цена из карточки становится одним вариантом.
  for (const p of products)
    if (p.price)
      plannedOffers.push({
        legacyKey: `${PRODUCT_PRICE_PREFIX}${p.bitrixId}`,
        productLegacyKey: p.legacyKey,
        data: offerData(p.title, BASE_CONFIGURATION, '—', p.price),
      })

  return { manufacturers, products: plannedProducts, offers: plannedOffers }
}

/** Значение поля без служебного id у строк массива: для сравнения «изменилось ли». */
function comparable(value) {
  if (value === undefined || value === '') return null
  if (Array.isArray(value))
    return value.map((item) => {
      if (!item || typeof item !== 'object') return item
      const { id: _id, ...rest } = item
      return rest
    })
  if (value && typeof value === 'object' && 'id' in value) return value.id
  return value
}

export function changedFields(doc, data) {
  return Object.keys(data).filter(
    (key) => JSON.stringify(comparable(doc[key])) !== JSON.stringify(comparable(data[key])),
  )
}

const decimalEqual = (a, b) => {
  const norm = (v) =>
    String(v)
      .replace(/(\.\d*?)0+$/, '$1')
      .replace(/\.$/, '')
  return norm(a) === norm(b)
}

function counter() {
  return { created: 0, updated: 0, unchanged: 0, unpublished: 0 }
}

/**
 * @typedef {{ created: number, updated: number, unchanged: number, unpublished: number }} Counter
 * @typedef {{ type: string, id: string, title: string, detail?: string }} WriteIssue
 * @typedef {object} WriteResult
 * @property {Counter} manufacturers
 * @property {Counter} products
 * @property {Counter} offers
 * @property {number} demoHidden
 * @property {{ currency: string, from: string | null, to: string }[]} rates
 * @property {WriteIssue[]} issues
 * @typedef {{ deadline?: number, log?: (message: string) => void }} PartOptions
 */

/**
 * Пустой итог записи: счётчики по видам записей, скрытые демотовары, курсы, замечания.
 * @returns {WriteResult}
 */
export function emptyResult() {
  return {
    manufacturers: counter(),
    products: counter(),
    offers: counter(),
    demoHidden: 0,
    rates: [],
    issues: [],
  }
}

/**
 * Складывает итог шага в общий итог запуска (на месте) и возвращает общий итог.
 * @param {WriteResult} total
 * @param {Partial<WriteResult>} part
 */
export function addResult(total, part) {
  for (const key of ['manufacturers', 'products', 'offers'])
    for (const [name, value] of Object.entries(part[key] ?? {})) total[key][name] += value
  total.demoHidden += part.demoHidden ?? 0
  total.rates.push(...(part.rates ?? []))
  total.issues.push(...(part.issues ?? []))
  return total
}

const OPTS = { overrideAccess: true, depth: 0 }

const findAll = async (payload, collection, where) =>
  (await payload.find({ collection, where, pagination: false, ...OPTS })).docs

/** Записи коллекции, у которых значение поля входит в список (пустой список — без запроса). */
const findIn = (payload, collection, field, values) =>
  values.length
    ? findAll(payload, collection, { [field]: { in: [...new Set(values)] } })
    : Promise.resolve([])

const timeIsUp = (deadline) => deadline !== undefined && Date.now() >= deadline

/** Производители: свой ключ импорта или запись с тем же названием (например, из демо). */
async function ensureManufacturers(payload, names, counter) {
  const existing = await findAll(payload, 'manufacturers')
  for (const name of names) {
    const key = manufacturerKey(name)
    const found =
      existing.find((m) => m.legacyKey === key) ??
      existing.find((m) => m.title.toLowerCase() === name.toLowerCase())
    if (found) {
      counter.unchanged++
      continue
    }
    const data = { title: name, status: 'published', legacyKey: key }
    existing.push(await payload.create({ collection: 'manufacturers', data, ...OPTS }))
    counter.created++
  }
}

/** Демотовары — в черновики, их адреса — с приставкой demo-: освобождаются для настоящих. */
async function hideDemoProducts(payload) {
  const update = (collection, id, data) => payload.update({ collection, id, data, ...OPTS })
  let hidden = 0
  for (const doc of (await findAll(payload, 'products')).filter(isDemo)) {
    const slug = doc.slug.startsWith('demo-') ? doc.slug : `demo-${doc.slug}`
    if (doc.status === 'draft' && slug === doc.slug) continue
    await update('products', doc.id, { status: 'draft', slug })
    hidden++
  }
  for (const doc of (await findAll(payload, 'offers')).filter(isDemo))
    if (doc.status !== 'draft') await update('offers', doc.id, { status: 'draft' })
  return hidden
}

/** Курсы: новая запись только если отличается от действующего курса (история не правится). */
async function updateRates(payload, rates, now) {
  const rateDocs = await payload.find({
    collection: 'exchange-rates',
    where: { effectiveAt: { less_than_equal: now.toISOString() } },
    sort: '-effectiveAt',
    pagination: false,
    ...OPTS,
  })
  const changes = []
  for (const [currency, value] of Object.entries(rates)) {
    const current = rateDocs.docs.find((r) => r.currency === currency)
    if (current && decimalEqual(current.kztPerUnit, value)) continue
    const data = { currency, kztPerUnit: value, effectiveAt: now.toISOString() }
    await payload.create({ collection: 'exchange-rates', data, ...OPTS })
    changes.push({ currency, from: current?.kztPerUnit ?? null, to: value })
  }
  return changes
}

/**
 * Начало запуска: производители, скрытие демотоваров, курсы. Быстрый шаг, делается один раз.
 * hideDemo — снять с публикации демотовары и освободить их адреса для настоящих.
 * @param {object} payload
 * @param {string[]} manufacturerNames
 * @param {{ now?: Date, hideDemo?: boolean, rates?: Record<string, string> }} [options]
 */
export async function startImport(
  payload,
  manufacturerNames,
  { now = new Date(), hideDemo = false, rates = IMPORT_RATES } = {},
) {
  const result = emptyResult()
  await ensureManufacturers(payload, manufacturerNames, result.manufacturers)
  if (hideDemo) result.demoHidden = await hideDemoProducts(payload)
  result.rates = await updateRates(payload, rates, now)
  return result
}

/** Создаёт запись или обновляет изменившиеся поля; считает итог в counter. */
async function upsert(payload, collection, existing, data, legacyKey, counter) {
  if (!existing) {
    await payload.create({ collection, data: { ...data, status: 'published', legacyKey }, ...OPTS })
    counter.created++
  } else if (changedFields(existing, data).length) {
    await payload.update({ collection, id: existing.id, data, ...OPTS })
    counter.updated++
  } else counter.unchanged++
}

/** Записи по значению поля: { значение → запись }. */
const byField = (docs, field) => new Map(docs.map((doc) => [doc[field], doc]))

/** Поиск производителя по ключу импорта или по названию (запись могла прийти из демо). */
async function makerLookup(payload) {
  const makers = await findAll(payload, 'manufacturers')
  return (name) => {
    if (!name) return null
    const key = manufacturerKey(name)
    const found =
      makers.find((m) => m.legacyKey === key) ??
      makers.find((m) => m.title.toLowerCase() === name.toLowerCase())
    return found?.id ?? null
  }
}

/**
 * Пишет часть товаров плана. Возвращает итог и сколько товаров успел записать (processed):
 * если время вышло (deadline — отметка Date.now()), остальное записывается следующим вызовом.
 * @param {object} payload
 * @param {PlannedProduct[]} items
 * @param {PartOptions} [options]
 */
export async function writeProducts(payload, items, { deadline, log = () => {} } = {}) {
  const result = emptyResult()
  const makerId = await makerLookup(payload)
  const keys = items.map((p) => p.legacyKey)
  const existingByKey = byField(await findIn(payload, 'products', 'legacyKey', keys), 'legacyKey')
  const slugOwners = await findIn(
    payload,
    'products',
    'slug',
    items.map((p) => p.slug),
  )
  const slugOwner = new Map(slugOwners.map((doc) => [doc.slug, doc.legacyKey ?? `id:${doc.id}`]))

  let processed = 0
  for (const planned of items) {
    if (timeIsUp(deadline)) break
    let slug = planned.slug
    const owner = slugOwner.get(slug)
    if (owner && owner !== planned.legacyKey) {
      const { bitrixId: id, data } = planned
      result.issues.push({ type: 'slugTaken', id, title: data.title, detail: slug })
      slug = `${slug}-${id}`
    }
    const data = { ...planned.data, manufacturer: makerId(planned.manufacturer), slug }
    const existing = existingByKey.get(planned.legacyKey)
    await upsert(payload, 'products', existing, data, planned.legacyKey, result.products)
    slugOwner.set(slug, planned.legacyKey)
    processed++
    if (processed % 100 === 0) log(`Товары: ${processed} из ${items.length}`)
  }
  return { result, processed }
}

/**
 * Пишет часть вариантов плана; товары к этому моменту уже записаны. Как writeProducts.
 * @param {object} payload
 * @param {PlannedOffer[]} items
 * @param {PartOptions} [options]
 */
export async function writeOffers(payload, items, { deadline, log = () => {} } = {}) {
  const result = emptyResult()
  const productKeys = items.map((o) => o.productLegacyKey)
  const products = byField(await findIn(payload, 'products', 'legacyKey', productKeys), 'legacyKey')
  const keys = items.map((o) => o.legacyKey)
  const existingByKey = byField(await findIn(payload, 'offers', 'legacyKey', keys), 'legacyKey')

  let processed = 0
  for (const planned of items) {
    if (timeIsUp(deadline)) break
    processed++
    const product = products.get(planned.productLegacyKey)
    if (!product) continue
    const data = { ...planned.data, product: product.id }
    const existing = existingByKey.get(planned.legacyKey)
    await upsert(payload, 'offers', existing, data, planned.legacyKey, result.offers)
    if (processed % 200 === 0) log(`Предложения: ${processed} из ${items.length}`)
  }
  return { result, processed }
}

/**
 * Конец запуска: выключенное в Битриксе или потерявшее цену снимается с публикации, но не
 * удаляется. plannedKeys — ключи всех товаров и вариантов плана, а не одной части.
 */
export async function finishImport(payload, plannedKeys) {
  const result = emptyResult()
  const keys = new Set(plannedKeys)
  for (const collection of ['products', 'offers'])
    for (const doc of (
      await payload.find({
        collection,
        pagination: false,
        select: { legacyKey: true, status: true },
        ...OPTS,
      })
    ).docs)
      if (isBitrix(doc) && !keys.has(doc.legacyKey) && doc.status === 'published') {
        await payload.update({ collection, id: doc.id, data: { status: 'draft' }, ...OPTS })
        result[collection].unpublished++
      }
  return result
}

/**
 * Ключи плана, которых нет в базе: товары (bitrix:product:…) ищутся среди товаров, остальное —
 * среди вариантов. Конец запуска снимает с публикации пропавшее только когда пусто: проверка
 * по самой базе, а не по счётчикам запуска.
 * @param {object} payload
 * @param {string[]} keys
 * @returns {Promise<string[]>}
 */
export async function missingKeys(payload, keys) {
  const found = new Set()
  for (const collection of ['products', 'offers']) {
    const wanted = keys.filter(
      (k) => k.startsWith('bitrix:product:') === (collection === 'products'),
    )
    for (let i = 0; i < wanted.length; i += 500)
      for (const doc of await findIn(payload, collection, 'legacyKey', wanted.slice(i, i + 500)))
        found.add(doc.legacyKey)
  }
  return keys.filter((k) => !found.has(k))
}

/** Все ключи плана: по ним конец запуска понимает, что пропало из выгрузки. */
export const plannedKeys = (plan) => [...plan.products, ...plan.offers].map((p) => p.legacyKey)

/** Вся запись за один вызов (для команды в терминале). payload — экземпляр Payload (Local API). */
export async function writeImport(
  payload,
  plan,
  { now = new Date(), hideDemo = false, rates = IMPORT_RATES, log = () => {} } = {},
) {
  const total = await startImport(payload, plan.manufacturers, { now, hideDemo, rates })
  addResult(total, (await writeProducts(payload, plan.products, { log })).result)
  addResult(total, (await writeOffers(payload, plan.offers, { log })).result)
  return addResult(total, await finishImport(payload, plannedKeys(plan)))
}
