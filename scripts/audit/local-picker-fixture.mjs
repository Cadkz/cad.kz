// Только для локальной базы: товары SCAD Soft и AutoCAD в том виде, как они пришли из Битрикса на демо
// (адреса, линейки, комплектации, цены в евро). Нужны, чтобы проверить подбор и семейства до сборки на демо.
// Запуск: pnpm payload run scripts/audit/local-picker-fixture.mjs <fixture.json>
// Файл с данными в репозиторий не кладём. На демо и рабочей базе не запускать.

import { readFileSync } from 'node:fs'
import config from '@payload-config'
import { getPayload } from 'payload'

const file = process.argv.at(-1)
if (!file?.endsWith('.json')) throw new Error('Укажите путь к fixture.json')
if (!/127\.0\.0\.1|localhost/.test(process.env.DATABASE_URL ?? ''))
  throw new Error('Скрипт только для локальной базы')
const data = JSON.parse(readFileSync(file, 'utf8'))
const payload = await getPayload({ config })
const opts = { overrideAccess: true, depth: 0 }

async function one(collection, where) {
  const { docs } = await payload.find({ collection, where, limit: 1, ...opts })
  return docs[0] ?? null
}
const sectionId = async (slug) => (await one('sections', { slug: { equals: slug } }))?.id
const vendor = async (title) =>
  (await one('manufacturers', { title: { equals: title } })) ??
  payload.create({ collection: 'manufacturers', data: { title, status: 'published' }, ...opts })

async function upsertProduct(fields, offers) {
  const existing = await one('products', { slug: { equals: fields.slug } })
  const doc = existing
    ? await payload.update({ collection: 'products', id: existing.id, data: fields, ...opts })
    : await payload.create({ collection: 'products', data: fields, ...opts })
  await payload.delete({ collection: 'offers', where: { product: { equals: doc.id } }, ...opts })
  for (const [configuration, amount] of offers)
    await payload.create({
      collection: 'offers',
      data: {
        title: `${fields.title} — ${configuration}`,
        status: 'published',
        product: doc.id,
        configuration,
        license: '—',
        amount,
        currency: 'EUR',
        includesVat: false,
        sourceVat: '16',
      },
      ...opts,
    })
  return doc
}

const scad = await vendor('SCAD Soft')
const autodesk = await vendor('Autodesk')
const lines = new Map()
for (const title of ['Программный комплекс', 'Сателлиты']) {
  const line =
    (await one('product-lines', {
      and: [{ manufacturer: { equals: scad.id } }, { title: { equals: title } }],
    })) ??
    (await payload.create({
      collection: 'product-lines',
      data: {
        title,
        manufacturer: scad.id,
        status: 'published',
        order: title === 'Сателлиты' ? 20 : 10,
      },
      ...opts,
    }))
  lines.set(title, line.id)
}

// Демотовар SCAD Office прячем: на демо его место занимает настоящий scad_v23.
const demo = await one('products', { slug: { equals: 'scad-office' } })
if (demo)
  await payload.update({ collection: 'products', id: demo.id, data: { status: 'draft' }, ...opts })

for (const [
  ,
  title,
  slug,
  line,
  lineOrder,
  main,
  extra,
  priority,
  offers,
  description,
] of data.scad) {
  const office = slug === 'scad_v23'
  await upsertProduct(
    {
      title,
      slug,
      status: 'published',
      kind: 'software',
      manufacturer: scad.id,
      line: lines.get(line),
      lineOrder,
      priority: priority ?? undefined,
      autoSections: false,
      mainSection: await sectionId(main),
      extraSections: await Promise.all(extra.map(sectionId)),
      summary: office ? data.scadOfficeSummary : undefined,
      description: office ? data.scadOfficeDescription : description,
    },
    offers,
  )
}

await upsertProduct(
  {
    title: 'AutoCAD',
    slug: 'autocad',
    status: 'published',
    kind: 'software',
    manufacturer: autodesk.id,
    priority: 'flagship',
    autoSections: false,
    mainSection: await sectionId('arch'),
    extraSections: [await sectionId('machine')],
    summary: data.autocadSummary,
    description: data.autocadDescription,
  },
  [],
)
for (const [, title, slug, main, extra, priority, description] of data.autodesk)
  await upsertProduct(
    {
      title,
      slug,
      status: 'published',
      kind: 'software',
      manufacturer: autodesk.id,
      priority,
      autoSections: false,
      mainSection: await sectionId(main),
      extraSections: await Promise.all(extra.map(sectionId)),
      description,
    },
    [],
  )

// Повторная проверка настройки подбора: снимаем отметку о выполнении.
await payload.delete({
  collection: 'import-runs',
  where: { idempotencyKey: { equals: 'catalog-setup:picker-v1' } },
  ...opts,
})
console.log('Готово: SCAD Soft', data.scad.length, 'товаров, AutoCAD и', data.autodesk.length)
await payload.destroy()
