// Только для локальной проверки: копия каталога демо (производители, товары, разделы, приоритеты,
// комплектации) в ЛОКАЛЬНУЮ базу, чтобы проверять меню, каталог, первые настройки и загрузку прайса
// на настоящих названиях. Снимок берётся с демо через браузер (/api/manufacturers, /api/products,
// /api/offers, /api/sections) и кладётся вне репозитория. Формат:
// { m: [[название, приоритет]], p: [[название, тип, №производителя, основной, доп. через пробел,
//   id на демо, приоритет, статус, адрес]], o: [[id товара на демо, комплектация, сумма, валюта,
//   условия лицензии (необязательно)]] }.
// Запуск (после миграций и seed-demo, до catalog-setup):
// pnpm exec payload run scripts/audit/mirror-catalog.mjs <путь к снимку.json>
import { readFileSync } from 'node:fs'
import config from '@payload-config'
import { getPayload } from 'payload'

const host = new URL(process.env.DATABASE_URL ?? 'postgres://x').hostname
if (process.env.APP_MODE !== 'demo' || !['localhost', '127.0.0.1'].includes(host)) {
  console.error('Копия каталога создаётся только в демо на локальной базе.')
  process.exit(1)
}
const file = process.argv.find((arg) => arg.endsWith('.json'))
if (!file) {
  console.error('Укажите путь к снимку .json')
  process.exit(1)
}
const snap = JSON.parse(readFileSync(file, 'utf8'))
const payload = await getPayload({ config })
const opts = { overrideAccess: true, depth: 0 }
const kinds = { s: 'software', h: 'hardware', c: 'course' }
const kind = (letter) => kinds[letter] ?? 'service'

const sections = await payload.find({ collection: 'sections', pagination: false, ...opts })
const sectionBySlug = new Map(sections.docs.map((s) => [s.slug, s.id]))
const makers = []
for (const [title, priority] of snap.m) {
  const found = await payload.find({
    collection: 'manufacturers',
    where: { title: { equals: title } },
    limit: 1,
    ...opts,
  })
  const data = { title, status: 'published', priority: priority ?? 'normal' }
  makers.push(
    found.docs[0]
      ? (await payload.update({ collection: 'manufacturers', id: found.docs[0].id, data, ...opts }))
          .id
      : (await payload.create({ collection: 'manufacturers', data, ...opts })).id,
  )
}

const offersBy = new Map()
for (const [productId, configuration, amount, currency, license] of snap.o)
  offersBy.set(productId, [
    ...(offersBy.get(productId) ?? []),
    { configuration, amount, currency, license: license || '—' },
  ])

let created = 0
for (const [title, letter, maker, main, extra, demoId, priority, status, slug] of snap.p) {
  const found = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
    ...opts,
  })
  if (found.docs[0]) continue
  const product = await payload.create({
    collection: 'products',
    data: {
      title,
      slug,
      status,
      priority: priority ?? undefined,
      kind: kind(letter),
      manufacturer: maker == null ? null : makers[maker],
      autoSections: false,
      mainSection: sectionBySlug.get(main) ?? null,
      extraSections: (extra ?? '')
        .split(' ')
        .map((s) => sectionBySlug.get(s))
        .filter(Boolean),
    },
    ...opts,
  })
  for (const offer of offersBy.get(demoId) ?? [])
    await payload.create({
      collection: 'offers',
      data: {
        title: `${title} — ${offer.configuration}`,
        status: 'published',
        product: product.id,
        configuration: offer.configuration,
        license: offer.license,
        amount: offer.amount,
        currency: offer.currency,
        includesVat: false,
        sourceVat: '16',
      },
      ...opts,
    })
  created++
}
console.log('Создано товаров', created)
await payload.destroy()
process.exit(0)
