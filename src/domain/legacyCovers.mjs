// @ts-check
// Обложки публикаций со старого cad.kz (замечание владельца 02.11.2026: у части статей обложки
// не подтянулись). Перенос брал обложкой первую картинку из текста; у статей без картинок в
// тексте обложки не было, а у новых — обрезанный скриншот. На старом сайте у каждой публикации
// есть своя картинка анонса — она видна только в списках (/articles/, /about/actions/, …).

/** Списки старого сайта, где у карточек есть картинка анонса. */
export const LISTINGS = ['/articles/', '/about/actions/', '/about/news/']

/** Адрес страницы списка: Битрикс листает параметром PAGEN_2. */
export const listingPage = (/** @type {string} */ base, /** @type {number} */ page) =>
  `${base}?PAGEN_2=${page}&SIZEN_2=9`

/**
 * Пары «адрес публикации → картинка анонса» из HTML списка: ссылка, внутри неё сразу картинка.
 * @param {string} html
 * @returns {Map<string, string>}
 */
export function listingCovers(html) {
  const found = new Map()
  const re =
    /<a href="(\/(?:articles|about\/actions|about\/news)\/[^"?#]+\/)"\s*>\s*<img\b[^>]*?\bsrc="(\/upload\/[^"]+)"/g
  for (const [, path = '', src = ''] of html.matchAll(re))
    if (!found.has(path)) found.set(path, src)
  return found
}

/** Раздел списка для адреса публикации. */
export function listingFor(/** @type {string} */ path) {
  return LISTINGS.find((base) => path.startsWith(base)) ?? null
}
