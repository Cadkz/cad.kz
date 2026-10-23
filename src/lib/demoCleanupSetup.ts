import type { Payload } from 'payload'
import { relId } from './rel'

/**
 * Решение владельца 23.10.2026: старые демокарточки первых дней демо удалить совсем, чтобы не
 * плодить дубли (они уже скрыты, адрес «demo-…», «demo:» в служебном ключе). Разово при сборке.
 * Удаляются только когда в базе уже есть товары из Битрикса — на чисто демонстрационной базе
 * демокарточки и есть весь каталог. Демо-предложения удаляются вместе с товаром; товар, на
 * который ссылается настоящее (не демо) предложение, остаётся — в отчёте видно, какой.
 * Удаления попадают в «Журнал действий».
 */
export const DEMO_CLEANUP_KEY = 'catalog-setup:delete-demo-cards-2026-10-23'
const opts = { overrideAccess: true, depth: 0, pagination: false } as const

const isDemo = (legacyKey: string | null | undefined) => String(legacyKey ?? '').startsWith('demo:')

export async function setupDemoCleanup(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: DEMO_CLEANUP_KEY } },
    limit: 1,
    overrideAccess: true,
  })
  if (done.docs.length) return null
  const real = await payload.count({
    collection: 'products',
    where: { legacyKey: { like: 'bitrix:' } },
    overrideAccess: true,
  })
  if (!real.totalDocs) return ['Товаров из Битрикса нет — демокарточки не трогаем']

  const products = (
    await payload.find({
      collection: 'products',
      where: { legacyKey: { like: 'demo:' } },
      select: { title: true, legacyKey: true, status: true },
      ...opts,
    })
  ).docs.filter((doc) => isDemo(doc.legacyKey) && doc.status === 'draft')
  const ids = new Set(products.map((doc) => doc.id))
  const offers = (
    await payload.find({
      collection: 'offers',
      where: { product: { in: [...ids] } },
      select: { product: true, legacyKey: true },
      ...opts,
    })
  ).docs

  const report: string[] = []
  const kept = new Set<number>()
  for (const offer of offers) {
    const product = relId(offer.product)
    if (product !== null && !isDemo(offer.legacyKey)) kept.add(product)
  }
  for (const offer of offers) {
    const product = relId(offer.product)
    if (product === null || kept.has(product)) continue
    await payload.delete({ collection: 'offers', id: offer.id, overrideAccess: true })
  }
  let deleted = 0
  for (const product of products) {
    if (kept.has(product.id)) {
      report.push(`${product.title} (ID ${product.id}): оставлен — у него настоящее предложение`)
      continue
    }
    await payload.delete({ collection: 'products', id: product.id, overrideAccess: true })
    deleted++
  }
  report.unshift(`Удалено старых демокарточек: ${deleted}`)
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: DEMO_CLEANUP_KEY, state: 'done', snapshot: { report } },
    overrideAccess: true,
  })
  return report
}
