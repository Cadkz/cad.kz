import type { Payload } from 'payload'
import type { SectionRule } from '../../payload-types'
import { SKIP_APPLY_CONTEXT } from '../cms/collections/sectionRules'
import { parseWords } from '../domain/sectionRules.mjs'
import { relId, relIds } from './rel'
import { applySectionRules, RULES_CONTEXT } from './sectionRules'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const AUDIT_CATALOG_KEY = 'catalog-setup:audit-catalog-v1'
const opts = { overrideAccess: true, depth: 0 } as const
const skip = { [SKIP_APPLY_CONTEXT]: true }

const low = (value: string | null | undefined) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
const words = (rule: SectionRule) => parseWords(rule.words).flat()

/**
 * Пакет 2 аудита 21.10.2026 на живом каталоге (К1, К4): SCAD Office — вторым разделом
 * «Архитектура и BIM» (основной остаётся «Расчёт конструкций»), курсы SCAD — в расчёте.
 * Revit в расчёт больше не добавляется (решение владельца 21.10.2026) — см. setupRevitBack.
 * Меняет «Правила разделов» и пересчитывает товары; товарам с ручными разделами раздел
 * добавляется напрямую. Что уже настроено вручную — не трогает. null — уже сделано.
 */
export async function setupAuditCatalog(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: AUDIT_CATALOG_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []

  const [sections, vendors, rulesFound] = await Promise.all([
    payload.find({ collection: 'sections', pagination: false, ...opts }),
    payload.find({ collection: 'manufacturers', pagination: false, ...opts }),
    payload.find({ collection: 'section-rules', pagination: false, ...opts }),
  ])
  const section = (slug: string) => sections.docs.find((doc) => doc.slug === slug)?.id
  const vendor = (title: string) => vendors.docs.find((doc) => low(doc.title) === low(title))?.id
  const arch = section('arch')
  const structural = section('structural')
  const scadSoft = vendor('SCAD Soft')
  const rules = rulesFound.docs
  const orders = new Set(rules.map((rule) => rule.order))
  /** Свободный номер проверки сразу перед правилом (правила идут с шагом 10). */
  const before = (order: number) => [5, 3, 1].map((d) => order - d).find((o) => !orders.has(o))

  // К4: курсы по расчёту ловят и SCAD.
  const course = rules.find(
    (rule) => rule.kind === 'course' && words(rule).some((w) => w === 'lira' || w === 'robot'),
  )
  if (course && !words(course).includes('scad')) {
    await payload.update({
      collection: 'section-rules',
      id: course.id,
      data: { words: `${course.words}, scad, скад` },
      context: skip,
      ...opts,
    })
    report.push(`правило «${course.title}»: добавлены слова scad, скад`)
  } else if (!course) report.push('правило курсов по расчёту не найдено — проверить вручную')

  // К1: основной SCAD Office — вторым разделом BIM, сателлиты остаются в расчёте.
  const scadGeneral = rules.find(
    (rule) => relId(rule.manufacturer) === scadSoft && !low(rule.words).trim(),
  )
  const scadOffice = rules.find(
    (rule) => relId(rule.manufacturer) === scadSoft && low(rule.words).includes('scad office'),
  )
  if (scadOffice) report.push(`правило «${scadOffice.title}» уже есть — не меняем`)
  else if (scadGeneral && scadSoft != null && structural != null && arch != null) {
    const order = before(scadGeneral.order)
    if (order == null) report.push('SCAD Office: нет свободного номера проверки — добавить вручную')
    else {
      await payload.create({
        collection: 'section-rules',
        data: {
          title: 'SCAD Office и программы-сателлиты — SCAD Office',
          order,
          manufacturer: scadSoft,
          kind: 'software',
          words: 'scad office',
          mainSection: structural,
          extraSections: [arch],
        },
        context: skip,
        ...opts,
      })
      orders.add(order)
      report.push('новое правило «SCAD Office»: Расчёт конструкций + Архитектура и BIM')
    }
  } else report.push('общее правило SCAD Soft не найдено — проверить вручную')

  const applied = await applySectionRules(payload)
  report.push(`товары пересчитаны по правилам: изменено ${applied.changed}`)

  // Товары с ручными разделами правила не трогают — нужный раздел добавляем сами.
  const { docs } = await payload.find({
    collection: 'products',
    where: { autoSections: { equals: false } },
    pagination: false,
    select: { title: true, kind: true, manufacturer: true, mainSection: true, extraSections: true },
    ...opts,
  })
  for (const product of docs) {
    const title = low(product.title)
    const by = relId(product.manufacturer)
    const add =
      by === scadSoft && product.kind === 'software' && title.includes('scad office')
        ? arch
        : product.kind === 'course' && /scad|скад/.test(title)
          ? structural
          : undefined
    const extra = relIds(product.extraSections)
    if (add == null || relId(product.mainSection) === add || extra.includes(add)) continue
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { extraSections: [...extra, add] },
      context: { [RULES_CONTEXT]: true },
      ...opts,
    })
    report.push(`${product.title}: добавлен раздел (ручные разделы)`)
  }

  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: AUDIT_CATALOG_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}

/** Ключ второй настройки: вернуть Revit из «Расчёта конструкций». */
export const REVIT_BACK_KEY = 'catalog-setup:audit-catalog-v2'

/**
 * Revit не в «Расчёте конструкций» (решение владельца 21.10.2026, отмена К2): убирает правило
 * «Revit LT» и раздел у правила Revit, добавленные первой настройкой, и раздел у товаров Revit
 * с ручными разделами. null — уже сделано.
 */
export async function setupRevitBack(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: REVIT_BACK_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []
  const [sections, vendors, rulesFound] = await Promise.all([
    payload.find({ collection: 'sections', where: { slug: { equals: 'structural' } }, ...opts }),
    payload.find({ collection: 'manufacturers', pagination: false, ...opts }),
    payload.find({ collection: 'section-rules', pagination: false, ...opts }),
  ])
  const structural = sections.docs[0]?.id
  const autodesk = vendors.docs.find((doc) => low(doc.title) === 'autodesk')?.id
  for (const rule of rulesFound.docs) {
    if (relId(rule.manufacturer) !== autodesk) continue
    const w = low(rule.words).trim()
    if (w === 'revit lt' && rule.title === 'Autodesk — Revit LT') {
      await payload.delete({ collection: 'section-rules', id: rule.id, context: skip, ...opts })
      report.push('правило «Revit LT» удалено')
    } else if (w === 'revit' && structural != null) {
      const extra = relIds(rule.extraSections)
      if (!extra.includes(structural)) continue
      await payload.update({
        collection: 'section-rules',
        id: rule.id,
        data: { extraSections: extra.filter((id) => id !== structural) },
        context: skip,
        ...opts,
      })
      report.push(`правило «${rule.title}»: «Расчёт конструкций» убран`)
    }
  }
  const applied = await applySectionRules(payload)
  report.push(`товары пересчитаны по правилам: изменено ${applied.changed}`)
  const { docs } = await payload.find({
    collection: 'products',
    where: { autoSections: { equals: false } },
    pagination: false,
    select: { title: true, kind: true, manufacturer: true, mainSection: true, extraSections: true },
    ...opts,
  })
  for (const product of docs) {
    const extra = relIds(product.extraSections)
    if (
      structural == null ||
      relId(product.manufacturer) !== autodesk ||
      !low(product.title).includes('revit') ||
      relId(product.mainSection) === structural ||
      !extra.includes(structural)
    )
      continue
    await payload.update({
      collection: 'products',
      id: product.id,
      data: { extraSections: extra.filter((id) => id !== structural) },
      context: { [RULES_CONTEXT]: true },
      ...opts,
    })
    report.push(`${product.title}: «Расчёт конструкций» убран (ручные разделы)`)
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: REVIT_BACK_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
