import { cardInfo } from '@/domain/cardTexts.mjs'
import { OTHER, vendorTree } from '../domain/catalogTree.mjs'
import type { CatalogItem, CatalogLine, Facet } from './catalog'
import { type FilterState, matches, topicView } from './catalogFilter'

/** Название программы без пояснения после тире: «АРБАТ - экспертиза…» → «АРБАТ». */
const shortName = (item: { title: string }) => cardInfo({ title: item.title, fallback: '' }).title

/** Плитка производителя в направлении: название, что у него есть, куда ведёт щелчок. */
export type VendorTile = {
  key: string
  title: string
  /** Что внутри, одной строкой: до трёх линеек или программ через запятую. */
  text: string
  count: number
  /** У производителя одна программа в разделе — плитка сразу ведёт на неё. */
  href: string | null
}

/**
 * Производители раздела в порядке каталога («Первыми в разделе», затем топы продаж). Товары —
 * как в обычном списке раздела: семейство одной карточкой, без программ семейства.
 */
export function vendorTiles(
  items: CatalogItem[],
  facets: Facet[],
  lines: CatalogLine[],
  state: FilterState,
): VendorTile[] {
  const section = state.type ?? state.direction
  // Курсы делятся по категориям, а не по производителям (topicView).
  if (!section || topicView(state)) return []
  const listState = { ...state, vendors: [], line: null }
  const scope = items.filter((item) => matches(item, listState))
  const titles = new Map(scope.flatMap((item) => (item.vendor ? [[item.vendor, item.vendor]] : [])))
  const pins = facets.find((facet) => facet.slug === section)?.pins ?? []
  const tree = vendorTree(
    scope.map((item) => ({ ...item, vendor: item.vendor ?? null })),
    lines.map((line) => ({ ...line })),
    titles as Map<string, string>,
    pins,
  )
  return tree
    .filter((vendor) => vendor.key !== OTHER)
    .map((vendor) => {
      const products = vendor.lines.flatMap((line) => line.items)
      const [only] = products
      const named = vendor.lines.filter((line) => line.key !== OTHER)
      return {
        key: vendor.key,
        title: vendor.title,
        // Единое правило для всех плиток (просьба владельца 27.10.2026): фраза — что внутри,
        // число позиций — отдельной строкой в плитке.
        text: (named.length > 1 ? named.map((line) => line.title) : products.map(shortName))
          .slice(0, 3)
          .join(', '),
        count: products.length,
        href: products.length === 1 && only ? only.href : null,
      }
    })
}

/**
 * Шаг «производитель»: в направлении сначала только плитки производителей, без перемешанных
 * карточек (решение владельца 22.10.2026, «как папки в Битриксе»). Не нужен, когда производитель
 * уже выбран, выбраны задачи или производитель в разделе один.
 */
export function vendorStepOn(state: FilterState, tiles: VendorTile[]) {
  return (
    state.vendors.length === 0 &&
    state.tasks.length === 0 &&
    !Object.values(state.features ?? {}).some((values) => values.length) &&
    tiles.length > 1
  )
}
