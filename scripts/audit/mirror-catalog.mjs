// Только для локальной проверки: копия каталога демо (названия, производители, разделы) в ЛОКАЛЬНУЮ базу,
// чтобы проверять меню, каталог и загрузку прайса на настоящих названиях.
// Снимок берётся с демо через браузер (/api/products, /api/manufacturers, /api/sections) и кладётся
// вне репозитория. Формат: { m: [производители], p: [[название, тип, №производителя, основной, доп.]],
// o: [[id товара на демо, комплектация, цена EUR]] }.
// Запуск: pnpm exec payload run scripts/audit/mirror-catalog.mjs <путь к снимку.json>
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

const sections = await payload.find({ collection: 'sections', limit: 100, ...opts })
const sectionBySlug = new Map(sections.docs.map((s) => [s.slug, s.id]))
const makers = []
for (const title of snap.m) {
  const found = await payload.find({
    collection: 'manufacturers',
    where: { title: { equals: title } },
    limit: 1,
    ...opts,
  })
  makers.push(
    found.docs[0]?.id ??
      (
        await payload.create({
          collection: 'manufacturers',
          data: { title, status: 'published' },
          ...opts,
        })
      ).id,
  )
}

const offersBy = new Map()
for (const [productId, configuration, amount] of snap.o)
  offersBy.set(productId, [...(offersBy.get(productId) ?? []), { configuration, amount }])

let created = 0
for (const [index, [title, letter, maker, main, extra, demoId]] of snap.p.entries()) {
  const slug = `mirror-${index}`
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
      status: 'published',
      kind: kind(letter),
      manufacturer: makers[maker] ?? null,
      autoSections: false,
      mainSection: sectionBySlug.get(main) ?? null,
      extraSections: extra
        .split(' ')
        .map((s) => sectionBySlug.get(s))
        .filter(Boolean),
    },
    ...opts,
  })
  const offers = offersBy.get(demoId) ?? [{ configuration: 'Базовая', amount: String(100 + index) }]
  for (const offer of offers)
    await payload.create({
      collection: 'offers',
      data: {
        title: `${title} — ${offer.configuration}`,
        status: 'published',
        product: product.id,
        configuration: offer.configuration,
        license: '—',
        amount: offer.amount,
        currency: 'EUR',
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
