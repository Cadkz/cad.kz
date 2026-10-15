import type { Payload } from 'payload'
import { listHref } from '@/domain/adminLinks.mjs'
import { levelRank } from '@/domain/adminQueue.mjs'
import { CHECK_HINTS, CHECK_LABELS, CHECKS, type Check } from '@/domain/quality.mjs'
import type { QueueCard, QueueItem } from './adminQueue'
import { loadPricingContext, PricingError, quoteOffer } from './pricing'
import { refreshQuality } from './productQuality'
import { visibleWhere } from './publications'
import { relId } from './rel'

/**
 * «Контроль качества» в админке: что не заполнено у товаров, предложений, публикаций и разделов,
 * которые видны на сайте. Перед расчётом обновляет отметку заполненности у всех товаров, чтобы
 * колонка и фильтры в списке товаров совпадали с этой страницей.
 */

const OPTS = { overrideAccess: true, depth: 0, pagination: false } as const
/** Сколько записей показывать в карточке (остальное — числом и ссылкой на список). */
const SHOW = 5
const published = { status: { equals: 'published' } }

export type QualitySummary = { products: number; full: number; average: number }
export type QualityReport = {
  summary: QualitySummary
  sections: { key: string; title: string; lead: string; cards: QueueCard[] }[]
}

type Row = { id: number; title: string; rank?: number; note?: string }

function card(
  key: string,
  title: string,
  hint: string,
  collection: string,
  rows: Row[],
  more?: { label: string; href: string },
): QueueCard {
  const sorted = [...rows].sort(
    (a, b) => (a.rank ?? 2) - (b.rank ?? 2) || a.title.localeCompare(b.title, 'ru'),
  )
  const items: QueueItem[] = sorted.slice(0, SHOW).map((row) => ({
    id: String(row.id),
    title: row.title,
    href: `/admin/collections/${collection}/${row.id}`,
    note: row.note ?? ((row.rank ?? 2) <= 1 ? 'топ продаж' : undefined),
  }))
  return {
    key,
    title,
    hint,
    total: rows.length,
    tone: 'normal',
    items,
    empty: 'Всё в порядке.',
    more: rows.length ? more : undefined,
  }
}

async function productCards(payload: Payload) {
  await refreshQuality(payload, null)
  const [products, makers] = await Promise.all([
    payload.find({
      collection: 'products',
      where: published,
      select: {
        title: true,
        priority: true,
        manufacturer: true,
        qualityScore: true,
        qualityGaps: true,
      },
      ...OPTS,
    }),
    payload.find({ collection: 'manufacturers', select: { priority: true }, ...OPTS }),
  ])
  const makerLevel = new Map(makers.docs.map((m) => [m.id, m.priority ?? null]))
  const byCheck = new Map<Check, Row[]>(CHECKS.map((check) => [check, []]))
  let full = 0
  let scores = 0
  for (const product of products.docs) {
    const score = product.qualityScore ?? 0
    scores += score
    if (score >= 100) full++
    const rank = levelRank(product.priority ?? makerLevel.get(relId(product.manufacturer) ?? -1))
    for (const gap of product.qualityGaps ?? [])
      byCheck.get(gap)?.push({ id: product.id, title: product.title, rank })
  }
  const cards = CHECKS.map((check) =>
    card(
      `product-${check}`,
      CHECK_LABELS[check],
      CHECK_HINTS[check],
      'products',
      byCheck.get(check) ?? [],
      {
        label: 'Все в списке товаров',
        href: listHref('products', [published, { qualityGaps: { in: [check] } }]),
      },
    ),
  )
  const total = products.docs.length
  const summary: QualitySummary = {
    products: total,
    full,
    average: total ? Math.round(scores / total) : 100,
  }
  return { summary, cards }
}

/** Предложения на сайте, у которых что-то не так: нет товара, товар скрыт, цена не считается. */
async function offerCards(payload: Payload) {
  const [offers, products, context] = await Promise.all([
    payload.find({
      collection: 'offers',
      where: published,
      select: {
        title: true,
        product: true,
        amount: true,
        currency: true,
        includesVat: true,
        sourceVat: true,
      },
      ...OPTS,
    }),
    payload.find({ collection: 'products', select: { title: true, status: true }, ...OPTS }),
    loadPricingContext(payload),
  ])
  const productById = new Map(products.docs.map((product) => [product.id, product]))
  const orphan: Row[] = []
  const hidden: Row[] = []
  const noRate: Row[] = []
  for (const offer of offers.docs) {
    const product = productById.get(relId(offer.product) ?? -1)
    const title = product ? `${product.title} — ${offer.title}` : offer.title
    if (!product) orphan.push({ id: offer.id, title })
    else if (product.status !== 'published') hidden.push({ id: offer.id, title })
    try {
      quoteOffer(offer, context)
    } catch (error) {
      if (error instanceof PricingError)
        noRate.push({ id: offer.id, title, note: `нет курса ${offer.currency}` })
      else noRate.push({ id: offer.id, title, note: 'цена записана с ошибкой' })
    }
  }
  return [
    card(
      'offer-orphan',
      'Без товара',
      'Предложение опубликовано, но не привязано к товару: на сайте его не видно.',
      'offers',
      orphan,
      {
        label: 'Все в списке предложений',
        href: listHref('offers', [published, { product: { exists: false } }]),
      },
    ),
    card(
      'offer-hidden',
      'Товар — черновик',
      'Предложение опубликовано, а товар нет: покупатель его не увидит. Опубликуйте товар или ' +
        'переведите предложение в черновик.',
      'offers',
      hidden,
    ),
    card(
      'offer-rate',
      'Цена не считается',
      'Цена в валюте, для которой не задан курс, или записана с ошибкой: на сайте «Запросить ' +
        'цену». Курсы — «Курсы валют».',
      'offers',
      noRate,
      { label: 'Курсы валют', href: '/admin/rates' },
    ),
  ]
}

/** Опубликованные публикации, которые видны на сайте: без анонса, без темы, без своей обложки. */
async function publicationCards(payload: Payload, now: Date) {
  const visible = visibleWhere(now)
  const { docs } = await payload.find({
    collection: 'publications',
    where: visible,
    select: { title: true, excerpt: true, theme: true, cover: true },
    ...OPTS,
  })
  const noExcerpt = docs.filter((doc) => !doc.excerpt?.trim())
  const noTheme = docs.filter((doc) => relId(doc.theme) == null)
  const noCover = docs.filter((doc) => relId(doc.cover) == null)
  const rows = (list: typeof docs): Row[] => list.map((doc) => ({ id: doc.id, title: doc.title }))
  const listOf = (condition: Record<string, unknown>) => ({
    label: 'Все в списке публикаций',
    href: listHref('publications', [published, condition]),
  })
  return [
    card(
      'pub-excerpt',
      'Нет анонса',
      'В карточке новости и в поиске Google — начало текста вместо анонса. Заполните «Анонс для ' +
        'карточки».',
      'publications',
      rows(noExcerpt),
      listOf({ or: [{ excerpt: { exists: false } }, { excerpt: { equals: '' } }] }),
    ),
    card(
      'pub-theme',
      'Нет темы',
      'Публикация не попадает в фильтр по темам и получает обложку-заглушку наугад.',
      'publications',
      rows(noTheme),
      listOf({ theme: { exists: false } }),
    ),
    card(
      'pub-cover',
      'Без своей обложки',
      'Не ошибка: в карточке показывается иллюстрация темы. Своя обложка — когда есть хорошая ' +
        'картинка 16 : 9.',
      'publications',
      rows(noCover),
      listOf({ cover: { exists: false } }),
    ),
  ]
}

/** Опубликованные разделы, в которых нет ни одного опубликованного товара. */
async function sectionCards(payload: Payload) {
  const [sections, products] = await Promise.all([
    payload.find({
      collection: 'sections',
      where: published,
      select: { title: true, parent: true },
      ...OPTS,
    }),
    payload.find({ collection: 'products', where: published, select: { sections: true }, ...OPTS }),
  ])
  const used = new Set(products.docs.flatMap((product) => (product.sections ?? []).map(relId)))
  // Товары подраздела видны и в родительском разделе.
  const parentOf = new Map(sections.docs.map((section) => [section.id, relId(section.parent)]))
  for (const id of [...used]) {
    let parent = id == null ? null : (parentOf.get(id) ?? null)
    while (parent != null && !used.has(parent)) {
      used.add(parent)
      parent = parentOf.get(parent) ?? null
    }
  }
  const empty = sections.docs
    .filter((section) => !used.has(section.id))
    .map((section) => ({ id: section.id, title: section.title }))
  return [
    card(
      'section-empty',
      'Пустые разделы',
      'Раздел опубликован, но товаров в нём нет: покупатель откроет пустую страницу. Добавьте ' +
        'товары или переведите раздел в черновик.',
      'sections',
      empty,
    ),
  ]
}

export async function loadQualityReport(
  payload: Payload,
  now = new Date(),
): Promise<QualityReport> {
  const products = await productCards(payload)
  const [offers, publications, sections] = await Promise.all([
    offerCards(payload),
    publicationCards(payload, now),
    sectionCards(payload),
  ])
  return {
    summary: products.summary,
    sections: [
      {
        key: 'products',
        title: 'Товары на сайте',
        lead: 'Флагманы и топы продаж — первыми: их стоит дозаполнить в первую очередь.',
        cards: products.cards,
      },
      {
        key: 'offers',
        title: 'Предложения',
        lead: 'Комплектации и лицензии, которые выбирает покупатель.',
        cards: offers,
      },
      {
        key: 'publications',
        title: 'Новости, статьи, акции',
        lead: 'Только те, что сейчас видны на сайте.',
        cards: publications,
      },
      {
        key: 'sections',
        title: 'Разделы каталога',
        lead: 'Учитываются и товары подразделов.',
        cards: sections,
      },
    ],
  }
}
