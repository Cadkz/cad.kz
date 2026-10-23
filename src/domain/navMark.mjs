/**
 * Жидкая метка второй строки шапки (SubNav, 24.10.2026): какой пункт сейчас выделен и как метка
 * к нему движется. Сама анимация — в CSS, здесь только выбор пункта и направления.
 */

/**
 * Какой пункт второй строки соответствует открытой странице. Пункт подходит, если совпал путь
 * (или один из путей `also`) и все параметры его адреса есть в адресе страницы. Из подходящих
 * берётся самый точный — с наибольшим числом параметров: «Акции» (/news?kind=promotion) точнее
 * «Новостей» (/news). Ничего не подошло — null.
 *
 * @param {{ href: string, also?: string[] }[]} links
 * @param {string} pathname
 * @param {string} search строка параметров страницы, например «?kind=promotion»; пусто — без них
 * @returns {number | null}
 */
export function activeLinkIndex(links, pathname, search) {
  const page = new URLSearchParams(search)
  let best = null
  let bestParams = -1
  links.forEach((link, index) => {
    const url = new URL(link.href, 'https://cad.kz')
    const paths = [url.pathname, ...(link.also ?? [])]
    if (!paths.some((path) => samePath(path, pathname))) return
    const params = [...url.searchParams]
    if (!params.every(([key, value]) => page.get(key) === value)) return
    if (params.length > bestParams) {
      best = index
      bestParams = params.length
    }
  })
  return best
}

function samePath(a, b) {
  const trim = (path) => (path.length > 1 ? path.replace(/\/+$/, '') : path)
  return trim(a) === trim(b)
}

/**
 * Как метка переходит с пункта `from` на пункт `to` (номера пунктов слева направо, null — метки нет):
 * enter — появляется на месте (линия прорисовывается слева направо), leave — исчезает,
 * right / left — перетекает в эту сторону, still — остаётся на месте.
 *
 * @param {number | null} from
 * @param {number | null} to
 * @returns {'enter' | 'leave' | 'right' | 'left' | 'still'}
 */
export function markMotion(from, to) {
  if (to === null) return from === null ? 'still' : 'leave'
  if (from === null) return 'enter'
  if (from === to) return 'still'
  return to > from ? 'right' : 'left'
}
