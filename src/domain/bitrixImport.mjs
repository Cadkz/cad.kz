// Запись каталога из Битрикса в базу сайта (Payload). Берёт результат buildCatalog и
// создаёт или обновляет записи по ключу импорта legacyKey. Повторный запуск обновляет то, что
// изменилось в Битриксе, и ничего не удаляет: пропавшее из выгрузки снимается с публикации.
//
// Что импорт не трогает у уже существующих записей: публикацию, разделы и направления, задачи,
// частые вопросы, рекомендации и галерею, если в ней уже что-то есть. Это правит редактор.

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

/** Что и в каком виде будет записано в базу. Без базы: удобно проверять тестами. */
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
 * Пишет план в базу. payload — экземпляр Payload (Local API).
 * hideDemo — снять с публикации демотовары и освободить их адреса для настоящих.
 */
export async function writeImport(
  payload,
  plan,
  { now = new Date(), hideDemo = false, rates = IMPORT_RATES, log = () => {} } = {},
) {
  const opts = { overrideAccess: true, depth: 0 }
  const all = async (collection) =>
    (await payload.find({ collection, pagination: false, ...opts })).docs
  const update = (collection, id, data) => payload.update({ collection, id, data, ...opts })
  const create = (collection, data) => payload.create({ collection, data, ...opts })
  const issues = []
  const result = {
    manufacturers: counter(),
    products: counter(),
    offers: counter(),
    demoHidden: 0,
    rates: [],
    issues,
  }

  // Производители: свой ключ импорта или запись с тем же названием (например, из демо).
  const manufacturerIds = new Map()
  const existingMakers = await all('manufacturers')
  for (const name of plan.manufacturers) {
    const key = manufacturerKey(name)
    const found =
      existingMakers.find((m) => m.legacyKey === key) ??
      existingMakers.find((m) => m.title.toLowerCase() === name.toLowerCase())
    if (found) {
      result.manufacturers.unchanged++
      manufacturerIds.set(name, found.id)
    } else {
      const doc = await create('manufacturers', {
        title: name,
        status: 'published',
        legacyKey: key,
      })
      result.manufacturers.created++
      manufacturerIds.set(name, doc.id)
    }
  }

  let products = await all('products')
  const offers = await all('offers')
  if (hideDemo) {
    for (const doc of products.filter(isDemo)) {
      const slug = doc.slug.startsWith('demo-') ? doc.slug : `demo-${doc.slug}`
      if (doc.status !== 'draft' || slug !== doc.slug) {
        await update('products', doc.id, { status: 'draft', slug })
        result.demoHidden++
      }
    }
    for (const doc of offers.filter(isDemo))
      if (doc.status !== 'draft') await update('offers', doc.id, { status: 'draft' })
    products = await all('products')
  }

  // Товары.
  const productByKey = new Map(products.filter(isBitrix).map((doc) => [doc.legacyKey, doc]))
  const slugOwner = new Map(products.map((doc) => [doc.slug, doc.legacyKey ?? `id:${doc.id}`]))
  const productIds = new Map()
  for (const [index, planned] of plan.products.entries()) {
    const data = {
      ...planned.data,
      manufacturer: manufacturerIds.get(planned.manufacturer) ?? null,
    }
    const existing = productByKey.get(planned.legacyKey)
    let slug = planned.slug
    const owner = slugOwner.get(slug)
    if (owner && owner !== planned.legacyKey) {
      issues.push({ type: 'slugTaken', id: planned.bitrixId, title: data.title, detail: slug })
      slug = `${slug}-${planned.bitrixId}`
    }
    if (existing) {
      const changes = changedFields(existing, { ...data, slug })
      if (changes.length) {
        await update('products', existing.id, { ...data, slug })
        result.products.updated++
      } else result.products.unchanged++
      productIds.set(planned.legacyKey, existing.id)
    } else {
      const doc = await create('products', {
        ...data,
        slug,
        status: 'published',
        legacyKey: planned.legacyKey,
      })
      result.products.created++
      productIds.set(planned.legacyKey, doc.id)
    }
    slugOwner.set(slug, planned.legacyKey)
    if ((index + 1) % 100 === 0) log(`Товары: ${index + 1} из ${plan.products.length}`)
  }

  // Предложения.
  const offerByKey = new Map(offers.filter(isBitrix).map((doc) => [doc.legacyKey, doc]))
  for (const [index, planned] of plan.offers.entries()) {
    const product = productIds.get(planned.productLegacyKey)
    if (!product) continue
    const data = { ...planned.data, product }
    const existing = offerByKey.get(planned.legacyKey)
    if (existing) {
      if (changedFields(existing, data).length) {
        await update('offers', existing.id, data)
        result.offers.updated++
      } else result.offers.unchanged++
    } else {
      await create('offers', { ...data, status: 'published', legacyKey: planned.legacyKey })
      result.offers.created++
    }
    if ((index + 1) % 200 === 0) log(`Предложения: ${index + 1} из ${plan.offers.length}`)
  }

  // Выключенное в Битриксе или потерявшее цену — снимаем с публикации, но не удаляем.
  const plannedKeys = new Set([...plan.products, ...plan.offers].map((p) => p.legacyKey))
  for (const [collection, docs] of [
    ['products', products],
    ['offers', offers],
  ])
    for (const doc of docs)
      if (isBitrix(doc) && !plannedKeys.has(doc.legacyKey) && doc.status === 'published') {
        await update(collection, doc.id, { status: 'draft' })
        result[collection].unpublished++
      }

  // Курсы: новая запись только если отличается от действующего курса (история не правится).
  const rateDocs = await payload.find({
    collection: 'exchange-rates',
    where: { effectiveAt: { less_than_equal: now.toISOString() } },
    sort: '-effectiveAt',
    pagination: false,
    ...opts,
  })
  for (const [currency, value] of Object.entries(rates)) {
    const current = rateDocs.docs.find((r) => r.currency === currency)
    if (current && decimalEqual(current.kztPerUnit, value)) continue
    await create('exchange-rates', {
      currency,
      kztPerUnit: value,
      effectiveAt: now.toISOString(),
    })
    result.rates.push({ currency, from: current?.kztPerUnit ?? null, to: value })
  }

  return result
}
