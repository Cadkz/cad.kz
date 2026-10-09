import type { CatalogItem } from './catalog'

type FamilyInfo = { title: string; href: string; summary: string | null }

/**
 * Каталог с семействами: товары без своей страницы прячутся, у линейки со страницей семейства
 * появляется одна карточка — на месте её программ, с самой низкой ценой среди них и разделами
 * всех программ. priceOf — цена «от» по ID товаров (её считает сервер, здесь только выбор).
 */
export function withFamilies(
  items: CatalogItem[],
  hidden: Set<number>,
  families: Map<number, FamilyInfo>,
  priceOf: (productIds: number[]) => { priceFrom: string | null; offers: number },
): CatalogItem[] {
  const members = new Map<number, CatalogItem[]>()
  for (const item of items) {
    const line = item.line == null ? null : Number(item.line)
    if (line != null && families.has(line)) members.set(line, [...(members.get(line) ?? []), item])
  }
  const cards: CatalogItem[] = []
  for (const [lineId, list] of members) {
    const family = families.get(lineId)
    const [first] = list
    if (!family || !first) continue
    const { priceFrom, offers } = priceOf(list.map((item) => item.id))
    cards.push({
      ...first,
      id: -lineId,
      href: family.href,
      title: family.title,
      summary: family.summary ?? first.summary,
      priceFrom,
      offersCount: Math.max(offers, 2),
      singleOffer: null,
      badge: null,
      directions: [...new Set(list.flatMap((item) => item.directions))],
      types: [...new Set(list.flatMap((item) => item.types))],
      tasks: [],
      rank: Math.max(...list.map((item) => item.rank)),
      lineOrder: 0,
    })
  }
  return [...items.filter((item) => !hidden.has(item.id)), ...cards]
}
