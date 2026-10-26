import type { Offer, Product } from '../../payload-types'
import { EXTRA_ORDER } from '../domain/familySeed.mjs'
import type { CatalogItem } from './catalog'
import { productPath } from './productPath'
import { relId } from './rel'

type FamilyInfo = { href: string }

type Input = {
  /** Все товары каталога, включая товары без своей страницы. */
  items: CatalogItem[]
  products: Product[]
  offersByProduct: Map<number, Offer[]>
  families: Map<number, FamilyInfo>
  /** Цена «от» по предложениям (считает сервер) и сколько их. */
  priceOf: (offers: Offer[]) => string | null
  /** Предложение, которое можно сразу положить в корзину, или null. */
  cartOf: (offers: Offer[]) => string | null
}

/**
 * Карточки, которых нет в обычном списке каталога (решение владельца 12.10.2026):
 * - программы семейства (сателлиты SCAD и др.) — видны, когда выбран производитель;
 * - варианты шагов подбора с галочкой «Показывать в каталоге карточками» (пакеты GEO5) —
 *   видны, когда выбран производитель или задача;
 * - товары без своей страницы с задачами, которые входят в подбор (отдельные программы GEO5), —
 *   видны, только когда выбрана задача.
 * Кнопка каждой карточки открывает страницу, где этот вариант уже выбран.
 */
export function catalogExtras({
  items,
  products,
  offersByProduct,
  families,
  priceOf,
  cartOf,
}: Input): CatalogItem[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  const extras: CatalogItem[] = []
  const used = new Set<number>()

  // Подборы: какие товары в них входят и какие шаги показываются карточками.
  const parentOf = new Map<number, Product>()
  for (const product of products) {
    if (product.pageView !== 'picker') continue
    const parent = byId.get(product.id)
    if (!parent) continue
    const steps = product.picker?.steps ?? []
    for (const step of steps)
      for (const entry of step.items ?? []) {
        const id = relId(entry.product)
        if (id != null && id !== product.id && !parentOf.has(id)) parentOf.set(id, product)
      }
    const hasSwitches = (product.picker?.switches ?? []).length > 0
    let n = 0
    for (const step of steps) {
      if (!step.inCatalog) continue
      for (const entry of step.items ?? []) {
        const id = relId(entry.product)
        const key = entry.id
        if (id == null || !key) continue
        const own = offersByProduct.get(id) ?? []
        const fixed = new Set((entry.offers ?? []).map((offer) => relId(offer)))
        const offers = fixed.size ? own.filter((offer) => fixed.has(offer.id)) : own
        const label = entry.label || byId.get(id)?.title || parent.title
        n += 1
        extras.push({
          ...parent,
          id: -(1_000_000 + parent.id * 1000 + n),
          href: `${parent.href}?item=${encodeURIComponent(key)}#config`,
          title: label.toLowerCase().includes(parent.title.toLowerCase())
            ? label
            : `${parent.title} ${label}`,
          summary: entry.note || null,
          // У пакета/модуля могут быть другие лицензии: исследование родительской программы не наследуем.
          research: null,
          lifecycle: null,
          priceFrom: priceOf(offers),
          offersCount: offers.length,
          cartOfferId: hasSwitches ? null : cartOf(offers),
          badge: null,
          tasks: entry.tasks ?? [],
          // Сразу после своего товара, в порядке шага.
          rank: parent.rank - n / 1000,
          scope: 'detail',
          entryType: 'Модуль',
          collectionNote: null,
        })
      }
    }
  }

  for (const product of products) {
    if (product.pageView !== 'none') continue
    const item = byId.get(product.id)
    if (!item || used.has(item.id)) continue
    const lineId = item.line == null ? null : Number(item.line)
    const family = lineId == null ? undefined : families.get(lineId)
    if (family) {
      // Продления и пакеты лицензий в каталоге не показываем: они в свёрнутом блоке семейства.
      if ((product.lineOrder ?? 0) >= EXTRA_ORDER) continue
      used.add(item.id)
      extras.push({
        ...item,
        href: `${family.href}?pick=${product.id}#${product.slug}`,
        cartOfferId: null,
        scope: 'detail',
      })
      continue
    }
    const parent = parentOf.get(product.id)
    if (!parent || !item.tasks.length) continue
    const parentItem = byId.get(parent.id)
    used.add(item.id)
    extras.push({
      ...item,
      href: `${productPath(parent)}?pick=${product.id}#config`,
      directions: item.directions.length ? item.directions : (parentItem?.directions ?? []),
      types: item.types.length ? item.types : (parentItem?.types ?? []),
      line: item.line ?? parentItem?.line ?? null,
      cartOfferId: null,
      scope: 'task',
    })
  }
  return extras
}
