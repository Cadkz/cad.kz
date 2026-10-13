import type { Payload } from 'payload'
import { ADDON_RULES, addonBases, RENAMES } from '../domain/addonsSeed.mjs'
import { mergeAliases } from '../domain/searchSeed.mjs'
import { relId } from './rel'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const ADDONS_SETUP_KEY = 'catalog-setup:addons-v1'
const opts = { overrideAccess: true, depth: 0 } as const

/**
 * «Требуется базовое ПО» у дополнений (MagiCAD для AutoCAD → AutoCAD, НТП для Revit → Revit)
 * и «AutoCAD LT for Mac» → «AutoCAD LT». Заполненное в админке поле не трогаем.
 * null — уже сделано.
 */
export async function setupAddons(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: ADDONS_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null

  const report: string[] = []
  const [{ docs: products }, { docs: lines }] = await Promise.all([
    payload.find({
      collection: 'products',
      pagination: false,
      select: { title: true, kind: true, line: true, requiresProducts: true, searchAliases: true },
      ...opts,
    }),
    payload.find({
      collection: 'product-lines',
      pagination: false,
      select: { title: true },
      ...opts,
    }),
  ])

  for (const rename of RENAMES) {
    const product = products.find((p) => p.title === rename.from)
    if (!product) {
      report.push(`не найдено — ${rename.from}`)
      continue
    }
    const searchAliases = mergeAliases(product.searchAliases, rename.aliases)
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { title: rename.to, searchAliases },
      ...opts,
    })
    product.title = rename.to
    report.push(`Переименован: ${rename.from} → ${rename.to}`)
  }

  const lineTitle = new Map(lines.map((line) => [line.id, line.title]))
  const baseId = new Map<string, number>()
  for (const rule of ADDON_RULES) {
    const base = products.find((p) => p.title === rule.base)
    if (base) baseId.set(rule.base, base.id)
    else report.push(`не найдено — базовая программа ${rule.base}`)
  }

  for (const product of products) {
    if ((product.requiresProducts ?? []).length) continue
    const lineId = relId(product.line)
    const bases = addonBases({
      title: product.title,
      kind: product.kind,
      line: lineId == null ? null : (lineTitle.get(lineId) ?? null),
    }).flatMap((title) => {
      const id = baseId.get(title)
      return id == null || id === product.id ? [] : [{ id, title }]
    })
    if (!bases.length) continue
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { requiresProducts: bases.map((base) => base.id) },
      ...opts,
    })
    report.push(`${product.title} → ${bases.map((base) => base.title).join(', ')}`)
  }

  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: ADDONS_SETUP_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
