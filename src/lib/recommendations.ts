import type { Payload } from 'payload'
import { plainTitle } from '@/domain/productTitle.mjs'
import { dayText, pickCourse } from '../domain/courseSchedule.mjs'
import { priorityRank } from '../domain/priority.mjs'
import {
  crossFor,
  type RecItem,
  SECTION_MATCH,
  type SectionInfo,
  similarFor,
} from '../domain/recommend.mjs'
import { collectionFor, linePickFor, PICKS_LIMIT, pinPicks } from '../domain/vendorPicks.mjs'
import { courseMatches, groupsForCourse } from './courseSchedule'
import { catalogAvailable } from './equipmentResearch'
import { catalogHref } from './navigationHrefs'
import { plural } from './plural'
import type { RelatedProduct } from './product'
import { productPath } from './productPath'
import { relId, relIds } from './rel'

type RecData = { items: RecItem[]; info: SectionInfo; cards: Map<number, RelatedProduct> }

/** Все опубликованные товары в коротком виде и настройки разделов для подборок. */
async function loadRecData(payload: Payload): Promise<RecData> {
  const published = { status: { equals: 'published' } } as const
  const [products, sections, manufacturers] = await Promise.all([
    payload.find({
      collection: 'products',
      // Товары без своей страницы в подборки не попадают: их адрес ведёт на подбор или семейство.
      where: { and: [published, { pageView: { not_equals: 'none' } }] },
      limit: 5000,
      pagination: false,
      depth: 0,
      select: {
        status: true,
        researchData: true,
        title: true,
        slug: true,
        legacyUrl: true,
        kind: true,
        manufacturer: true,
        mainSection: true,
        sections: true,
        requiresProducts: true,
        similarProducts: true,
        recommended: true,
        suggestSimilar: true,
        suggestCross: true,
        priority: true,
        topOrder: true,
      },
    }),
    payload.find({
      collection: 'sections',
      where: published,
      limit: 500,
      pagination: false,
      depth: 0,
      select: { slug: true, isDirection: true, crossSections: true },
    }),
    payload.find({
      collection: 'manufacturers',
      limit: 500,
      pagination: false,
      depth: 0,
      select: { title: true, priority: true },
    }),
  ])
  const vendors = new Map(manufacturers.docs.map((m) => [m.id, m.title]))
  const vendorLevel = new Map(manufacturers.docs.map((m) => [m.id, m.priority]))
  const info: SectionInfo = new Map(
    sections.docs.map((s) => [
      s.id,
      {
        isDirection: Boolean(s.isDirection),
        cross: relIds(s.crossSections),
        match: Object.hasOwn(SECTION_MATCH, s.slug) ? SECTION_MATCH[s.slug] : undefined,
      },
    ]),
  )
  const items: RecItem[] = []
  const cards = new Map<number, RelatedProduct>()
  for (const product of products.docs) {
    if (!catalogAvailable(product)) continue
    const vendor = vendors.get(relId(product.manufacturer) ?? -1) ?? null
    const sectionIds = relIds(product.sections)
    items.push({
      id: product.id,
      title: product.title,
      vendor,
      kind: product.kind,
      main: relId(product.mainSection) ?? sectionIds[0] ?? null,
      sections: sectionIds,
      requires: relIds(product.requiresProducts),
      manualSimilar: relIds(product.similarProducts),
      manualCross: relIds(product.recommended),
      suggestSimilar: product.suggestSimilar !== false,
      suggestCross: product.suggestCross !== false,
      rank: priorityRank(
        product.priority,
        vendorLevel.get(relId(product.manufacturer) ?? -1),
        product.topOrder,
      ),
    })
    cards.set(product.id, {
      slug: product.slug,
      href: productPath(product),
      title: plainTitle(product.title),
      vendor,
    })
  }
  return { items, info, cards }
}

const toCards = (ids: number[], cards: Map<number, RelatedProduct>) =>
  ids.map((id) => cards.get(id)).filter((card): card is RelatedProduct => Boolean(card))

/** Линейка производителя строкой подборки: ведёт в каталог на эту линейку. */
async function lineCard(payload: Payload, title: string): Promise<RelatedProduct | null> {
  const { docs } = await payload.find({
    collection: 'product-lines',
    where: { and: [{ title: { equals: title } }, { status: { equals: 'published' } }] },
    limit: 1,
    depth: 1,
  })
  const line = docs[0]
  const vendor = typeof line?.manufacturer === 'object' ? line.manufacturer : null
  if (!line || !vendor) return null
  const count = await payload.count({
    collection: 'products',
    where: { and: [{ line: { equals: line.id } }, { status: { equals: 'published' } }] },
  })
  if (!count.totalDocs) return null
  return {
    slug: `line-${line.id}`,
    href: catalogHref({ group: 'software', vendor: vendor.title, line: String(line.id) }),
    title: plainTitle(line.title),
    vendor: vendor.title,
    note: `${count.totalDocs} ${plural(count.totalDocs, 'программа', 'программы', 'программ')}`,
  }
}

/**
 * Курс к программе с ближайшей группой из расписания УЦ (просьба владельца 30.10.2026): строкой
 * «С этим покупают» с подписью «Старт 1 декабря». Нет расписания или курса — null, страница не
 * ждёт ошибку таблицы.
 */
async function scheduledCourse(
  payload: Payload,
  target: RecItem,
  items: RecItem[],
  cards: Map<number, RelatedProduct>,
): Promise<RelatedProduct | null> {
  if (target.kind !== 'software') return null
  try {
    const matches = await courseMatches(payload)
    const listed = new Set(items.filter((item) => item.kind === 'course').map((item) => item.id))
    const candidates = matches.courses.flatMap((course) => {
      const next = groupsForCourse(matches, course.id)[0]
      return listed.has(course.id) && next ? [{ ...course, next: next.start }] : []
    })
    const course = pickCourse(target.title, candidates)
    const card = course ? cards.get(course.id) : null
    return card && course ? { ...card, note: `Старт ${dayText(course.next, matches.today)}` } : null
  } catch (error) {
    console.error('Расписание курсов: подборка без курса', error instanceof Error ? error.name : '')
    return null
  }
}

/**
 * Подборки для страницы товара: «С этим покупают» и «Похожие» без повторов между ними, по две
 * строки (решение владельца 27.10.2026). У программ Autodesk второй в «С этим покупают» — AEC
 * Collection, у машиностроительных (Inventor, Fusion) — Product Design & Manufacturing Collection, к AutoCAD и Revit первой — линейка MagiCAD (src/domain/vendorPicks.mjs).
 */
export async function getRecommendations(payload: Payload, productId: number) {
  const { items, info, cards } = await loadRecData(payload)
  const target = items.find((item) => item.id === productId)
  if (!target) return { cross: [], similar: [], limit: PICKS_LIMIT }
  const found = crossFor([target], items, info, { limit: PICKS_LIMIT + 2 })
  const autodesk = target.vendor === 'Autodesk' && target.kind === 'software'
  const collection = collectionFor(target.title)
  const aec = autodesk
    ? items.find((item) => item.vendor === 'Autodesk' && collection.test(item.title))
    : undefined
  const lineTitle = autodesk ? linePickFor(target.title) : null
  const line = lineTitle ? await lineCard(payload, lineTitle) : null
  const cross = pinPicks(
    toCards(found, cards),
    {
      first: line,
      second: aec && aec.id !== target.id ? (cards.get(aec.id) ?? null) : null,
    },
    (card) => card.href,
  )
  // Курс с ближайшей группой — третьей строкой, если он есть в расписании; тогда и в «Похожих»
  // три строки, чтобы панели были ровными.
  const course = await scheduledCourse(payload, target, items, cards)
  if (course) {
    const at = cross.findIndex((card) => card.href === course.href)
    if (at >= 0) cross.splice(at, 1)
    cross.splice(PICKS_LIMIT, cross.length, course)
  }
  const limit = course ? PICKS_LIMIT + 1 : PICKS_LIMIT
  const shown = new Set(cross.map((card) => card.href))
  const similar = similarFor(target, items, {
    limit,
    exclude: items.filter((item) => shown.has(cards.get(item.id)?.href ?? '')).map((i) => i.id),
  })
  return { cross, similar: toCards(similar, cards), limit }
}
