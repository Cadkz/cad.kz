import type { Offer, Product } from '../../payload-types'
import { EXTRA_ORDER } from '../domain/familySeed.mjs'
import type { CatalogItem } from './catalog'
import { relId } from './rel'

/**
 * Вариант внутри карточки каталога: модуль, пакет или редакция в подборе (GEO5 «Устойчивость
 * откоса», ЛИРА-FEM Pro), программа семейства без своей страницы (сателлит SCAD). Нужен Кадди:
 * он советует вариант, а ссылка под ответом открывает страницу, где этот вариант уже выбран.
 */
export type CatalogVariant = {
  /** id карточки каталога, внутри которой вариант (у семейства — минус id линейки). */
  parent: number
  /** Уникальный id для карточки под ответом (схема та же, что у карточек каталога). */
  id: number
  /** Короткое название: «Устойчивость откоса», «Pro». */
  label: string
  /** Полное: «GEO5 Устойчивость откоса». */
  title: string
  href: string
  priceFrom: string | null
  /** Подпись варианта из админки или задачи программы — модели, чтобы выбрать вариант. */
  about: string | null
}

type Input = {
  /** Все товары каталога, включая товары без своей страницы. */
  items: CatalogItem[]
  products: Product[]
  offersByProduct: Map<number, Offer[]>
  families: Map<number, { href: string }>
  /** Цена «от» по предложениям (считает сервер). */
  priceOf: (offers: Offer[]) => string | null
}

/** «GEO5» + «Устойчивость откоса» → «GEO5 Устойчивость откоса»; «AutoCAD LT» не дублирует «AutoCAD». */
function fullTitle(parent: string, label: string) {
  return label.toLowerCase().includes(parent.toLowerCase()) ? label : `${parent} ${label}`
}

function shortAbout(note: string | null | undefined, tasks: string[]) {
  const text = note?.trim() || tasks.join(', ')
  return text ? text.replace(/\s+/g, ' ').slice(0, 120) : null
}

/**
 * Варианты всех подборов и семейств. Товар со своей страницей в каталоге вариантом не считается:
 * поиск находит его сам, и ссылка под ответом ведёт на его страницу.
 */
export function catalogVariants({
  items,
  products,
  offersByProduct,
  families,
  priceOf,
}: Input): CatalogVariant[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  const ownPage = new Set(products.filter((p) => p.pageView !== 'none').map((p) => p.id))
  const variants: CatalogVariant[] = []
  const inPicker = new Set<number>()

  for (const product of products) {
    const parent = byId.get(product.id)
    if (product.pageView !== 'picker' || !parent) continue
    let n = 0
    for (const step of product.picker?.steps ?? [])
      for (const entry of step.items ?? []) {
        const id = relId(entry.product)
        const key = entry.id
        const item = id == null ? undefined : byId.get(id)
        if (id == null || !key || !item) continue
        if (id !== product.id && ownPage.has(id)) continue
        const own = offersByProduct.get(id) ?? []
        const fixed = new Set((entry.offers ?? []).map((offer) => relId(offer)))
        const offers = fixed.size ? own.filter((offer) => fixed.has(offer.id)) : own
        const label = (entry.label || item.title).trim()
        n += 1
        inPicker.add(id)
        variants.push({
          parent: product.id,
          id: -(1_000_000 + product.id * 1000 + n),
          label: withoutPrefix(label, parent.title),
          title: fullTitle(parent.title, label),
          href: `${parent.href}?item=${encodeURIComponent(key)}#config`,
          priceFrom: priceOf(offers),
          about: shortAbout(entry.note, id === product.id ? [] : item.tasks),
        })
      }
  }

  for (const product of products) {
    if (product.pageView !== 'none' || inPicker.has(product.id)) continue
    const item = byId.get(product.id)
    const lineId = item?.line == null ? null : Number(item.line)
    const family = lineId == null ? undefined : families.get(lineId)
    if (!item || lineId == null || !family) continue
    // Продления и пакеты мест — в свёрнутом блоке семейства, Кадди их не советует.
    if ((product.lineOrder ?? 0) >= EXTRA_ORDER) continue
    variants.push({
      parent: -lineId,
      id: product.id,
      label: item.title,
      title: item.title,
      href: `${family.href}?pick=${product.id}#${product.slug}`,
      priceFrom: priceOf(offersByProduct.get(product.id) ?? []),
      about: shortAbout(item.summary, item.tasks),
    })
  }
  return variants
}

/** «GEO5 Базовый» в подборе GEO5 → «Базовый»: короткое название варианта для модели. */
function withoutPrefix(label: string, parent: string) {
  const rest = label.slice(parent.length).trim()
  return label.toLowerCase().startsWith(`${parent.toLowerCase()} `) && rest ? rest : label
}
