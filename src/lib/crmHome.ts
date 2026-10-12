import type { Payload } from 'payload'
import type { HomePage } from '../../payload-types'
import {
  CRM_POPULAR,
  CRM_POPULAR_V1_LABELS,
  CRM_RENEW_BAND,
  ESTIMATE_SUMMARY_FIX,
} from '../domain/crmCatalogSeed.mjs'

const opts = { overrideAccess: true, depth: 0 } as const

/** Товар для карточки: по адресу, иначе по началу названия среди опубликованных. */
async function findProduct(payload: Payload, slug: string | null, title: RegExp | null) {
  if (slug) {
    const { docs } = await payload.find({
      collection: 'products',
      where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
      limit: 1,
      ...opts,
    })
    if (docs[0]) return docs[0].id
  }
  if (!title) return null
  const { docs } = await payload.find({
    collection: 'products',
    where: { status: { equals: 'published' } },
    pagination: false,
    select: { title: true },
    ...opts,
  })
  return docs.find((doc) => title.test(doc.title.trim()))?.id ?? null
}

type PopularItems = NonNullable<NonNullable<HomePage['popular']>['items']>

/** Плитки «Популярных решений» по CRM_POPULAR: товар — для логотипа, ссылка — если своя. */
async function popularItems(payload: Payload, report: string[]): Promise<PopularItems> {
  const items: PopularItems = []
  for (const card of CRM_POPULAR) {
    const product = await findProduct(payload, card.slug, card.title)
    if (!product) report.push(`Популярные решения: не найден товар для «${card.label}»`)
    // Без товара и своей ссылки плитка ведёт в каталог.
    items.push({ product, title: card.label, href: card.href ?? (product ? null : '/catalog') })
  }
  return items
}

/**
 * Главная по CRM: «Популярные решения» (если блок пуст) и полоса «Продление лицензий»
 * (если у неё нет заголовка). Правленное в админке не трогаем.
 */
export async function setupCrmHome(payload: Payload): Promise<string[]> {
  const report: string[] = []
  const page: HomePage = await payload.findGlobal({ slug: 'home-page', ...opts })
  const data: Partial<HomePage> = {}
  if (!page.popular?.items?.length) {
    const items = await popularItems(payload, report)
    data.popular = { title: page.popular?.title || 'Популярные решения', lead: null, items }
    report.push(`Популярные решения: ${items.length} плиток`)
  }
  if (!page.renew?.title) {
    data.renew = { title: CRM_RENEW_BAND.title, text: CRM_RENEW_BAND.text }
    report.push('Полоса «Продление лицензий» на главной')
  }
  if (Object.keys(data).length) await payload.updateGlobal({ slug: 'home-page', data, ...opts })
  return report
}

/** Ключ записи в журнале «Запуски импорта»: замена плиток выполняется один раз. */
export const POPULAR_V2_KEY = 'home-setup:popular-v2'

/**
 * «Популярные решения» плитками (замечание владельца 12.10.2026): блок первого наполнения
 * заменяется новым списком (АВС-KZ, Revit и AEC и Inventor и Fusion — в каталог). Блок, который
 * правили в админке, не трогаем. null — уже сделано.
 */
export async function setupPopularV2(payload: Payload): Promise<string[] | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: POPULAR_V2_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: string[] = []
  const page: HomePage = await payload.findGlobal({ slug: 'home-page', ...opts })
  const titles = (page.popular?.items ?? []).map((item) => item.title ?? '')
  const untouched =
    titles.length === CRM_POPULAR_V1_LABELS.length &&
    titles.every((title, i) => title === CRM_POPULAR_V1_LABELS[i])
  if (untouched) {
    const items = await popularItems(payload, report)
    await payload.updateGlobal({
      slug: 'home-page',
      data: { popular: { title: page.popular?.title || 'Популярные решения', lead: null, items } },
      ...opts,
    })
    report.push(
      `Популярные решения: ${items.length} плиток (${items.map((i) => i.title).join(', ')})`,
    )
  } else report.push('Популярные решения правили в админке — не трогаем')
  const estimate = await payload.find({
    collection: 'sections',
    where: { slug: { equals: 'estimate' } },
    limit: 1,
    ...opts,
  })
  const [before, after] = ESTIMATE_SUMMARY_FIX
  const section = estimate.docs[0]
  if (section && section.summary === before) {
    await payload.update({
      collection: 'sections',
      id: section.id,
      data: { summary: after },
      ...opts,
    })
    report.push('Описание «Смет»: АВС-4 → АВС-KZ')
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: POPULAR_V2_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
