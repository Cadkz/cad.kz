import { TREE_GROUPS, type TreeGroup } from '@/domain/adminCatalog.mjs'
import { countByGroup, filterPriceRows } from '@/domain/priceEdit.mjs'
import type { PriceGridRow } from './offerPrices'
import type { PriceFolder } from './usePriceGrid'

/**
 * Вкладка и папка «Цен» в адресе (?group=hardware&vendor=12): «Назад» в браузере возвращает
 * на шаг назад, ссылку на папку можно отправить коллеге — как в «Каталоге».
 */

const GROUPS: TreeGroup[] = TREE_GROUPS.map((item) => item.value)

export type PricePlace = { group: TreeGroup; vendor: PriceFolder }

/** Место из адреса; без вкладки в адресе — вкладка, где поиск из ссылки нашёл больше всего. */
export function readPricePlace(search: string, rows: PriceGridRow[], query: string): PricePlace {
  const params = new URLSearchParams(search)
  const raw = params.get('vendor')
  const vendor: PriceFolder =
    raw === 'none' ? 'none' : raw && /^\d+$/.test(raw) ? Number(raw) : null
  const group = GROUPS.find((value) => value === params.get('group'))
  if (group) return { group, vendor }
  if (query.trim()) {
    const counts = countByGroup(filterPriceRows(rows, { query }))
    const best = [...GROUPS].sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))[0]
    return { group: best ?? 'software', vendor: null }
  }
  return { group: 'software', vendor: null }
}

/** Записать место в адрес новым шагом истории. */
export function pushPricePlace(place: PricePlace) {
  const params = new URLSearchParams({ group: place.group })
  if (place.vendor !== null) params.set('vendor', String(place.vendor))
  window.history.pushState(null, '', `?${params}`)
}
