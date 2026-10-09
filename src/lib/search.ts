import { searchItems } from '../domain/search.mjs'
import { type CatalogItem, getCatalog } from './catalog'

/** Поиск по каталогу: те же карточки, что в каталоге (с семействами вместо скрытых товаров). */
export async function searchCatalog(query: string): Promise<CatalogItem[]> {
  if (!query.trim()) return []
  const { items } = await getCatalog()
  return searchItems(items, query)
}
