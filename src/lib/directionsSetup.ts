import type { Payload } from 'payload'
import { SKIP_APPLY_CONTEXT } from '../cms/collections/sectionRules'
import {
  DIRECTION_ORDER,
  DIRECTION_TEXTS,
  MERGED_DIRECTIONS,
  remapSections,
} from '../domain/directionsNine.mjs'
import { relId, relIds } from './rel'
import { applySectionRules, RULES_CONTEXT } from './sectionRules'

/**
 * Девять направлений (решение владельца 27.10.2026, src/domain/directionsNine.mjs): «Визуализация»
 * → «САПР, BIM и визуализация», «Промышленные объекты и трубопроводы» → «Инженерные сети
 * и трубопроводы». Переносит товары, «Правила разделов» и «С этим покупают» у разделов, влитые
 * разделы — в черновики (не удаляются: вернуть — опубликовать и перенести товары обратно).
 * Новые описания карточек. ЛИРА-FEM вторым разделом в BIM — как SCAD Office (замечание владельца:
 * «у SCAD в BIM SCAD Office, а у ЛИРЫ только САПФИР»). null — уже сделано.
 */
export const DIRECTIONS_KEY = 'catalog-setup:directions-nine-2026-10-27'
const opts = { overrideAccess: true, depth: 0 } as const
const skip = { [SKIP_APPLY_CONTEXT]: true }

export async function setupDirectionsNine(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: DIRECTIONS_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []

  const sections = await payload.find({ collection: 'sections', pagination: false, ...opts })
  const bySlug = new Map(sections.docs.map((s) => [s.slug, s]))
  const moves = new Map<number, number>()
  for (const [from, to] of Object.entries(MERGED_DIRECTIONS)) {
    const source = bySlug.get(from)
    const target = bySlug.get(to)
    if (source && target) moves.set(source.id, target.id)
    else report.push(`раздел ${from} → ${to}: не найден, пропущено`)
  }

  // Правила разделов — чтобы следующий импорт из Битрикса ставил уже новые разделы.
  const rules = await payload.find({ collection: 'section-rules', pagination: false, ...opts })
  let rulesChanged = 0
  for (const rule of rules.docs) {
    const next = remapSections(relId(rule.mainSection), relIds(rule.extraSections), moves)
    if (!next.changed) continue
    await payload.update({
      collection: 'section-rules',
      id: rule.id,
      data: { mainSection: next.main, extraSections: next.extra },
      context: skip,
      ...opts,
    })
    rulesChanged++
  }
  report.push(`правил разделов перенесено: ${rulesChanged}`)

  // ЛИРА-FEM: основной раздел — расчёт, вторым — BIM (как у SCAD Office).
  const lira = (
    await payload.find({
      collection: 'manufacturers',
      where: { title: { equals: 'ЛИРА-FEM' } },
      limit: 1,
      ...opts,
    })
  ).docs[0]
  const arch = bySlug.get('arch')
  const structural = bySlug.get('structural')
  if (lira && arch && structural) {
    const orders = new Set(rules.docs.map((rule) => rule.order))
    const general = rules.docs.find(
      (rule) => relId(rule.manufacturer) === lira.id && !(rule.words ?? '').trim(),
    )
    const base = general?.order ?? 1000
    const order = [5, 3, 1, 7, 9].map((d) => base - d).find((o) => o > 0 && !orders.has(o))
    if (order == null) report.push('ЛИРА-FEM: нет свободного номера правила — добавить вручную')
    else {
      await payload.create({
        collection: 'section-rules',
        data: {
          title: 'ЛИРА-FEM — ЛИРА САПР',
          order,
          manufacturer: lira.id,
          kind: 'software',
          words: 'лира сапр',
          mainSection: structural.id,
          extraSections: [arch.id],
        },
        context: skip,
        ...opts,
      })
      report.push('новое правило «ЛИРА САПР»: Расчёт конструкций + САПР, BIM и визуализация')
    }
  }
  const applied = await applySectionRules(payload)
  report.push(`товары пересчитаны по правилам: изменено ${applied.changed}`)

  // Товары с ручными разделами правила не трогают — переносим сами (и все остальные — на всякий).
  const products = await payload.find({
    collection: 'products',
    pagination: false,
    select: { title: true, kind: true, manufacturer: true, mainSection: true, extraSections: true },
    ...opts,
  })
  let moved = 0
  for (const product of products.docs) {
    const next = remapSections(relId(product.mainSection), relIds(product.extraSections), moves)
    const isLira =
      lira &&
      arch &&
      relId(product.manufacturer) === lira.id &&
      product.kind === 'software' &&
      /лира\s*сапр/i.test(product.title)
    const extra =
      isLira && next.main !== arch.id && !next.extra.includes(arch.id)
        ? [...next.extra, arch.id]
        : next.extra
    if (!next.changed && extra === next.extra) continue
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { mainSection: next.main, extraSections: extra },
      context: { [RULES_CONTEXT]: true },
      ...opts,
    })
    moved++
  }
  report.push(`товаров перенесено в новые разделы: ${moved}`)

  // «С этим покупают» у разделов и сами разделы: тексты, влитые — в черновики.
  for (const section of sections.docs) {
    const cross = relIds(section.crossSections)
    const nextCross = [...new Set(cross.map((id) => moves.get(id) ?? id))].filter(
      (id) => id !== section.id && !moves.has(section.id),
    )
    const text = DIRECTION_TEXTS[section.slug]
    const merged = moves.has(section.id)
    const crossChanged =
      nextCross.length !== cross.length || nextCross.some((id, i) => id !== cross[i])
    if (!text && !merged && !crossChanged) continue
    await payload.update({
      collection: 'sections',
      id: section.id,
      data: {
        ...(text ? { summary: text.summary, ...(text.title ? { title: text.title } : {}) } : {}),
        ...(merged ? { status: 'draft' as const } : {}),
        ...(crossChanged && !merged ? { crossSections: nextCross } : {}),
      },
      context: skip,
      ...opts,
    })
    report.push(
      merged
        ? `«${section.title}» влит и снят с публикации`
        : `«${text?.title ?? section.title}»: ${text ? 'новое описание' : 'связи обновлены'}`,
    )
  }

  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: DIRECTIONS_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}

/**
 * VRED и Alias (промышленный дизайн) после слияния оказались в «САПР, BIM и визуализация» рядом
 * с машиностроением и вылезли в «Похожих» у AutoCAD. Им место только в «Машиностроении».
 */
export const DIRECTIONS_V2_KEY = 'catalog-setup:directions-nine-v2-2026-10-27'

export async function setupDirectionsNineV2(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: DIRECTIONS_V2_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []
  const sections = await payload.find({ collection: 'sections', pagination: false, ...opts })
  const arch = sections.docs.find((s) => s.slug === 'arch')?.id
  const machine = sections.docs.find((s) => s.slug === 'machine')?.id
  if (arch != null && machine != null) {
    const { docs } = await payload.find({
      collection: 'products',
      where: { or: [{ title: { like: 'VRED' } }, { title: { like: 'Alias' } }] },
      pagination: false,
      select: { title: true, mainSection: true, extraSections: true },
      ...opts,
    })
    for (const product of docs) {
      const main = relId(product.mainSection)
      const extra = relIds(product.extraSections)
      if (main !== arch && !extra.includes(arch)) continue
      const nextMain = main === arch ? machine : main
      await payload.update({
        collection: 'products',
        id: product.id,
        data: {
          mainSection: nextMain,
          extraSections: extra.filter((id) => id !== arch && id !== nextMain),
          // Ручные разделы: следующий импорт по правилам не вернёт их в BIM.
          autoSections: false,
        },
        context: { [RULES_CONTEXT]: true },
        ...opts,
      })
      report.push(`${product.title}: только «Машиностроение»`)
    }
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: DIRECTIONS_V2_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}

/**
 * Порядок направлений (решение владельца 27.10.2026, src/domain/directionsNine.mjs): САПР и BIM
 * первыми, затем расчёт, геотехника, сметы, машиностроение, генплан, сети. Меняет только поле
 * «Порядок вывода» у разделов, дальше его можно править в админке.
 */
export const DIRECTIONS_ORDER_KEY = 'catalog-setup:directions-order-2026-10-27'

export async function setupDirectionsOrder(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: DIRECTIONS_ORDER_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []
  const sections = await payload.find({ collection: 'sections', pagination: false, ...opts })
  for (const section of sections.docs) {
    const order = DIRECTION_ORDER[section.slug]
    if (order == null || section.order === order) continue
    await payload.update({
      collection: 'sections',
      id: section.id,
      data: { order },
      context: skip,
      ...opts,
    })
    report.push(`«${section.title}»: место ${order / 10}`)
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: DIRECTIONS_ORDER_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
