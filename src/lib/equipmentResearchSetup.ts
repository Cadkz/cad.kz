import type { Payload } from 'payload'
import research from '../domain/equipmentResearch.json' with { type: 'json' }
import { relId, relIds } from './rel'

export const EQUIPMENT_RESEARCH_KEY = 'catalog-setup:equipment-research-v1'
const opts = { overrideAccess: true, depth: 0 } as const

type Seed = (typeof research.products)[number]

export function researchDescription(seed: Pick<Seed, 'overview' | 'sections'>) {
  return [
    ...seed.overview,
    ...seed.sections.flatMap((section) => [
      `## ${section.title}`,
      section.text,
      section.bullets.map((bullet) => `- ${bullet}`).join('\n'),
    ]),
  ]
    .filter(Boolean)
    .join('\n\n')
}

/** Повтор после сбоя обновляет те же записи Кадди; отметка ставится только в конце. */
export async function setupEquipmentResearch(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: EQUIPMENT_RESEARCH_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const products = (await payload.find({ collection: 'products', pagination: false, ...opts })).docs
  const report: string[] = []
  let missing = 0
  for (const seed of research.products) {
    const category = research.categories.find((entry) => entry.order.includes(seed.slug))?.category
    // order нужен только для принадлежности к категории, порядок товаров не переносим.
    if (!category || /iridium/i.test(seed.slug)) continue
    const product = products.find((entry) => entry.slug === seed.slug)
    if (!product) {
      missing++
      report.push(`Не найден товар: ${seed.slug}`)
      continue
    }
    await payload.update({
      collection: 'products',
      id: product.id,
      data: {
        summary: seed.summary,
        description: researchDescription(seed),
        properties: [
          // Артикул нужен интеграциям; старые описательные характеристики заменяем исследованием.
          ...(product.properties ?? [])
            .filter((entry) => entry.name.trim().toLowerCase() === 'артикул')
            .map(({ name, value }) => ({ name, value })),
          ...seed.specs
            .filter((spec) => String(spec.value ?? '').trim())
            .map((spec) => ({
              name: spec.group ? `${spec.group} — ${spec.name}` : spec.name,
              value: [spec.value, spec.unit].filter(Boolean).join(' '),
            })),
        ],
        researchData: {
          category,
          filters: seed.filters,
          status: seed.status,
          replacedBy: seed.replacedBy,
        },
        mainSection: relId(product.mainSection),
        extraSections: relIds(product.extraSections),
      },
      ...opts,
    })
    // Отдельный стабильный ключ в поле product не затрагивает существующие записи базы знаний.
    const key = `Каталог: ${seed.slug}`
    const existing = await payload.find({
      collection: 'assistant-knowledge',
      where: { product: { equals: key } },
      limit: 1,
      ...opts,
    })
    const text = [
      `${product.title}. ${seed.compare}`,
      seed.status === 'discontinued'
        ? `Снят с производства.${seed.replacedBy ? ` Замена: ${products.find((entry) => entry.slug === seed.replacedBy)?.title ?? seed.replacedBy}.` : ''}`
        : '',
    ]
      .filter(Boolean)
      .join('\n')
    const data = { product: key, text, active: true }
    const entry = existing.docs[0]
    if (entry)
      await payload.update({ collection: 'assistant-knowledge', id: entry.id, data, ...opts })
    else await payload.create({ collection: 'assistant-knowledge', data, ...opts })
    report.push(`Обновлён ${product.title}: описание, характеристики, фильтры, сравнение для Кадди`)
    if (product.title !== seed.title)
      report.push(`Название не меняли: ${product.title} → предлагается ${seed.title}`)
  }
  if (missing) {
    report.push(`Не найдено товаров: ${missing}. Настройка будет повторена при следующей сборке.`)
    return report
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: EQUIPMENT_RESEARCH_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
