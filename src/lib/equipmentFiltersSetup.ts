import type { Payload } from 'payload'
import { EQUIPMENT_FILTERS_V2, mergeFilters } from '../domain/equipmentFiltersV2.mjs'
import { relId, relIds } from './rel'

/**
 * Фильтры плоттеров и широкоформатных сканеров по образцу владельца (23.10.2026), разово при
 * сборке: в `researchData.filters` товара пишутся новые группы (формат, технология, разрешение,
 * скорость, цветность), заменённые старые группы стираются. Остальные поля не трогаем.
 */
export const EQUIPMENT_FILTERS_KEY = 'catalog-setup:equipment-filters-v2'
const opts = { overrideAccess: true, depth: 0 } as const

export async function setupEquipmentFiltersV2(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: EQUIPMENT_FILTERS_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []
  let missing = 0
  for (const [category, bySlug] of Object.entries(EQUIPMENT_FILTERS_V2)) {
    const { docs } = await payload.find({
      collection: 'products',
      where: { slug: { in: Object.keys(bySlug) } },
      pagination: false,
      ...opts,
    })
    for (const [slug, next] of Object.entries(bySlug)) {
      const product = docs.find((entry) => entry.slug === slug)
      const research =
        product?.researchData && typeof product.researchData === 'object'
          ? (product.researchData as Record<string, unknown>)
          : null
      // Без загруженного исследования у товара нет категории фильтра — повторим при следующей сборке.
      if (!product || !research) {
        missing++
        report.push(`Не найден товар с исследованием: ${slug}`)
        continue
      }
      const current =
        research.filters && typeof research.filters === 'object'
          ? (research.filters as Record<string, unknown>)
          : null
      await payload.update({
        collection: 'products',
        id: product.id,
        data: {
          researchData: { ...research, filters: mergeFilters(category, current, next) },
          mainSection: relId(product.mainSection),
          extraSections: relIds(product.extraSections),
        },
        ...opts,
      })
      report.push(`${product.title}: фильтры обновлены`)
    }
  }
  if (missing) {
    report.push(`Не найдено товаров: ${missing}. Настройка будет повторена при следующей сборке.`)
    return report
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: EQUIPMENT_FILTERS_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
