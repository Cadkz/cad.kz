/**
 * Решения владельца 23.10.2026 по итогам исследования каталога (src/lib/ownerCatalogFixes.ts).
 * Чистые данные и функции без базы.
 */

/** У этих программ — прежние описания: тексты исследования владелец не принял. */
export const KEEP_OWN_TEXT = ['scad_v23', 'autocad']

/**
 * Снятые с производства модели скрыты из каталога, но эти есть в наличии у CAD.kz — показываются
 * как обычные товары, без пометки «Снят с производства».
 */
export const IN_STOCK_SLUGS = ['imageprograf_tz_30000']

/** Строка для Кадди вместо «Снят с производства. Замена: …». */
export const IN_STOCK_NOTE =
  'Модель предыдущего поколения, CAD.kz продаёт её из наличия; остаток и срок поставки уточнит менеджер.'

/**
 * Переименования из отчёта разовой настройки `catalog-setup:navigation-v1`: строки «Было → Стало».
 * @param {unknown} lines
 * @returns {{ from: string, to: string }[]}
 */
export function navigationRenames(lines) {
  if (!Array.isArray(lines)) return []
  return lines.flatMap((line) => {
    if (typeof line !== 'string') return []
    const [from, to, ...rest] = line.split(' → ')
    if (!from || !to || rest.length || from === to) return []
    return [{ from: from.trim(), to: to.trim() }]
  })
}
