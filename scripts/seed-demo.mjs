// Демонстрационное наполнение CMS: разделы, товары с предложениями, новости, акции,
// курсы валют, контакты и тексты главной. Повторный запуск обновляет записи, а не дублирует их.
// Запуск: APP_MODE=demo pnpm payload run scripts/seed-demo.mjs

import config from '@payload-config'
import { getPayload } from 'payload'
import {
  demoHome,
  demoProducts,
  demoPublications,
  demoRates,
  demoSections,
  demoSettings,
} from '../src/domain/demo.ts'

if (process.env.APP_MODE !== 'demo') {
  console.error('Демоданные загружаются только при APP_MODE=demo.')
  process.exit(1)
}

const payload = await getPayload({ config })

// При первом запуске на хостинге (--first-time) данные грузятся, только если каталог пуст,
// чтобы повторная сборка не затирала правки в админке.
if (process.env.SEED_ONLY_IF_EMPTY === '1') {
  const existing = await payload.count({ collection: 'products', overrideAccess: true })
  if (existing.totalDocs > 0) {
    console.log('В каталоге уже есть товары: демоданные не трогаем.')
    await payload.destroy()
    process.exit(0)
  }
}
const opts = { overrideAccess: true, depth: 0 }
const count = { created: 0, updated: 0 }

/** Создаёт или обновляет запись по ключу импорта demo:<тип>:<ключ>. */
async function upsert(collection, key, data) {
  const legacyKey = `demo:${collection}:${key}`
  const found = await payload.find({
    collection,
    where: { legacyKey: { equals: legacyKey } },
    limit: 1,
    ...opts,
  })
  const doc = found.docs[0]
  if (doc) {
    count.updated++
    return payload.update({ collection, id: doc.id, data, ...opts })
  }
  count.created++
  return payload.create({ collection, data: { ...data, legacyKey }, ...opts })
}

const slug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

try {
  const manufacturers = new Map()
  for (const title of new Set(demoProducts.map((product) => product.manufacturer))) {
    const doc = await upsert('manufacturers', slug(title) || title, { title, status: 'published' })
    manufacturers.set(title, doc.id)
  }

  const sections = new Map()
  for (const { key, ...section } of demoSections) {
    const doc = await upsert('sections', key, { ...section, slug: key, status: 'published' })
    sections.set(key, doc.id)
  }

  const products = new Map()
  for (const product of demoProducts) {
    const doc = await upsert('products', product.key, {
      title: product.title,
      slug: product.key,
      status: 'published',
      kind: product.kind,
      summary: product.summary,
      description: product.description,
      manufacturer: manufacturers.get(product.manufacturer),
      sections: product.sections.map((key) => sections.get(key)),
      tasks: product.tasks.map((title) => ({ title })),
      properties: product.properties ?? [],
      faq: product.faq ?? [],
    })
    products.set(product.key, doc.id)
    for (const { key, ...offer } of product.offers) {
      await upsert('offers', key, {
        ...offer,
        title: offer.configuration,
        status: 'published',
        product: doc.id,
      })
    }
  }

  // Связи между товарами — вторым проходом, когда все товары уже созданы.
  for (const product of demoProducts) {
    await payload.update({
      collection: 'products',
      id: products.get(product.key),
      data: {
        requiresProducts: (product.requires ?? []).map((key) => products.get(key)),
        recommended: (product.recommended ?? []).map((key) => products.get(key)),
      },
      ...opts,
    })
  }

  for (const publication of demoPublications) {
    const { key, ...data } = publication
    await upsert('publications', key, { ...data, slug: key, status: 'published' })
  }

  // Курс добавляется новой записью, только если такого значения ещё нет: история курсов не правится.
  for (const rate of demoRates) {
    const latest = await payload.find({
      collection: 'exchange-rates',
      where: { currency: { equals: rate.currency } },
      sort: '-effectiveAt',
      limit: 1,
      ...opts,
    })
    if (latest.docs[0]?.kztPerUnit !== rate.kztPerUnit) {
      await payload.create({
        collection: 'exchange-rates',
        data: { ...rate, effectiveAt: new Date().toISOString() },
        ...opts,
      })
      count.created++
    }
  }

  await payload.updateGlobal({ slug: 'site-settings', data: demoSettings, ...opts })
  await payload.updateGlobal({ slug: 'home-page', data: demoHome, ...opts })

  console.log(
    `Демоданные загружены: создано ${count.created}, обновлено ${count.updated}. ` +
      `Товаров ${products.size}, разделов ${sections.size}, публикаций ${demoPublications.length}.`,
  )
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await payload.destroy()
  process.exit(process.exitCode ?? 0)
}
