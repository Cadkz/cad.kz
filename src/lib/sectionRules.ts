import type { Payload, PayloadRequest } from 'payload'
import type { Product, SectionRule as SectionRuleDoc } from '../../payload-types'
import { type SectionRule, sectionsByRules } from '../domain/sectionRules.mjs'
import { relId, relIds } from './rel'

/** Признак в context: запись сделана правилами, хук товара не пересчитывает разделы. */
export const RULES_CONTEXT = 'sectionRules'

type Req = Partial<PayloadRequest> | undefined

/** Правила из админки в виде для чистых функций: производитель и разделы — ID строкой. */
export async function loadRules(payload: Payload, req?: Req): Promise<SectionRule[]> {
  const { docs } = await payload.find({
    collection: 'section-rules',
    limit: 2000,
    depth: 0,
    overrideAccess: true,
    pagination: false,
    req,
  })
  return docs.map((doc: SectionRuleDoc) => ({
    order: doc.order ?? 100,
    vendor: relId(doc.manufacturer)?.toString() ?? null,
    kind: doc.kind ?? null,
    words: doc.words ?? '',
    main: relId(doc.mainSection)?.toString() ?? null,
    extra: relIds(doc.extraSections).map(String),
    retire: Boolean(doc.retire),
  }))
}

type ProductLike = Pick<Product, 'title' | 'kind' | 'manufacturer'>

/** Разделы товара по правилам: ID основного и дополнительных, признак «снят с продажи». */
export function rulesResult(rules: SectionRule[], product: ProductLike) {
  const result = sectionsByRules(rules, {
    title: product.title,
    kind: product.kind,
    vendor: relId(product.manufacturer)?.toString() ?? null,
  })
  if (!result) return null
  return {
    main: result.main ? Number(result.main) : null,
    extra: result.extra.map(Number),
    retire: result.retire,
  }
}

const sameList = (a: number[], b: number[]) =>
  a.length === b.length && a.every((value, index) => value === b[index])

export type ApplyReport = {
  checked: number
  changed: number
  hidden: number
  noRule: number
  manual: number
}

type RuleProductDoc = Pick<
  Product,
  'id' | 'title' | 'kind' | 'manufacturer' | 'mainSection' | 'extraSections' | 'status'
>

/** Что поменять у товара по правилам; null — подходящего правила нет. */
function planUpdate(rules: SectionRule[], product: RuleProductDoc) {
  const result = rulesResult(rules, product)
  if (!result) return null
  const hide = result.retire && product.status === 'published'
  const sectionsChanged =
    relId(product.mainSection) !== result.main ||
    !sameList(relIds(product.extraSections), result.extra)
  return { result, hide, sectionsChanged }
}

/**
 * Применяет правила ко всем товарам с галочкой «Подбирать разделы по правилам».
 * Пишет только изменившееся; товар без подходящего правила не трогает (разделы не стираются).
 * Правило «снят с продажи» снимает товар с публикации.
 */
export async function applySectionRules(payload: Payload, req?: Req): Promise<ApplyReport> {
  const rules = await loadRules(payload, req)
  const { docs } = await payload.find({
    collection: 'products',
    limit: 5000,
    depth: 0,
    overrideAccess: true,
    pagination: false,
    req,
    select: {
      title: true,
      kind: true,
      manufacturer: true,
      mainSection: true,
      extraSections: true,
      autoSections: true,
      status: true,
    },
  })
  const report: ApplyReport = { checked: 0, changed: 0, hidden: 0, noRule: 0, manual: 0 }
  for (const product of docs) {
    if (product.autoSections === false) {
      report.manual++
      continue
    }
    report.checked++
    const plan = planUpdate(rules, product)
    if (!plan) report.noRule++
    if (!plan || (!plan.sectionsChanged && !plan.hide)) continue
    await payload.update({
      collection: 'products',
      id: product.id,
      data: {
        mainSection: plan.result.main,
        extraSections: plan.result.extra,
        ...(plan.hide ? { status: 'draft' as const } : {}),
      },
      depth: 0,
      overrideAccess: true,
      context: { [RULES_CONTEXT]: true },
      req,
    })
    if (plan.sectionsChanged) report.changed++
    if (plan.hide) report.hidden++
  }
  return report
}
