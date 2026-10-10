import { searchDetailed } from '../domain/search.mjs'
import { type CatalogItem, getCatalog } from './catalog'
import { getSearchExtras } from './searchText'

export type CatalogSearch = {
  items: CatalogItem[]
  /** Нашлись не все слова запроса: показаны похожие товары. */
  partial: boolean
}

/**
 * Поиск по каталогу: те же карточки, что в каталоге (с семействами вместо скрытых товаров).
 * Разделы, состав и описание товара поиску даёт getSearchExtras, в карточки они не попадают.
 */
export async function searchCatalog(query: string): Promise<CatalogSearch> {
  if (!query.trim()) return { items: [], partial: false }
  const [{ items }, extras] = await Promise.all([getCatalog(), getSearchExtras()])
  const searchable = items.map((item) => ({
    ...item,
    // У карточки семейства id — минус id линейки (src/lib/familyCards.ts).
    ...(item.id < 0 ? extras.families.get(-item.id) : extras.products.get(item.id)),
    item,
  }))
  const found = searchDetailed(searchable, query)
  return { items: found.items.map((entry) => entry.item), partial: found.partial }
}
