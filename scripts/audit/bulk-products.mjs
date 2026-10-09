// Только для локальной проверки: ~750 тестовых товаров по разделам демоданных, объём как на демо
// (меню, каталог, скорость). Запуск после pnpm demo:setup на ЛОКАЛЬНОЙ базе:
//   pnpm exec payload run scripts/audit/bulk-products.mjs
// Номера разделов и производителей — из демоданных (16 разделов, 9 производителей).
import config from '@payload-config'
import { getPayload } from 'payload'

const host = new URL(process.env.DATABASE_URL ?? 'postgres://x').hostname
if (process.env.APP_MODE !== 'demo' || !['localhost', '127.0.0.1'].includes(host)) {
  console.error('Тестовые товары создаются только в демо на локальной базе.')
  process.exit(1)
}

const payload = await getPayload({ config })
const opts = { overrideAccess: true, depth: 0 }
const plan = [
  // [раздел, сколько, тип, производитель]
  [1, 140, 'software', 1],
  [2, 90, 'software', 2],
  [3, 60, 'software', 3],
  [4, 50, 'software', 1],
  [5, 80, 'software', 4],
  [6, 30, 'software', 5],
  [7, 70, 'software', 1],
  [8, 40, 'software', 1],
  [9, 30, 'software', 7],
  [10, 25, 'hardware', 6],
  [11, 35, 'hardware', 8],
  [12, 30, 'course', 9],
  [13, 12, 'hardware', 8],
  [14, 40, 'hardware', 8],
  [15, 8, 'hardware', 9],
  [16, 6, 'service', 9],
]
const words = ['Pro', 'Standard', 'Lite', 'Suite', 'Ultimate', 'Plus', 'Expert', 'Basic']
let n = 0
for (const [section, count, kind, manufacturer] of plan) {
  for (let i = 0; i < count; i++) {
    n++
    const title = `Тестовый товар ${n} ${words[n % words.length]} для проверки длинных названий`
    const slug = `bulk-${n}`
    const found = await payload.find({
      collection: 'products',
      where: { slug: { equals: slug } },
      limit: 1,
      ...opts,
    })
    if (found.docs[0]) continue
    await payload.create({
      collection: 'products',
      data: {
        title,
        slug,
        status: 'published',
        kind,
        summary: 'Описание тестового товара для локальной проверки объёма.',
        manufacturer,
        autoSections: false,
        mainSection: section,
        extraSections: n % 5 === 0 ? [(section % 9) + 1] : [],
      },
      ...opts,
    })
  }
}
console.log('Создано/проверено', n)
await payload.destroy()
process.exit(0)
