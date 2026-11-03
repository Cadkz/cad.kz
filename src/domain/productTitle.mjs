// @ts-check
/**
 * Название товара без пояснений в скобках (просьба владельца 27.10.2026): «LIRA-FEM (Лира-Сапр)»
 * → «LIRA-FEM», «Программный комплекс АВС-KZ (АВС-4)» → «Программный комплекс АВС-KZ». В карточке,
 * меню и на странице товара — одно название. В базе название не меняется: полное остаётся для
 * поиска (`withTitleAlias`), заголовка вкладки браузера и заявки менеджеру.
 * @param {string} title
 */
export function plainTitle(title) {
  let result = title
  // Вложенные скобки снимаются изнутри наружу: «A (B (C))» → «A».
  for (let i = 0; i < 3 && /\([^()]*\)/.test(result); i++)
    result = result.replace(/\s*\([^()]*\)/g, '')
  result = result
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.:;])/g, '$1')
    .trim()
  // Название только из скобок или с непарной скобкой оставляем как было.
  return result && !/[()]/.test(result) ? result : title
}

/**
 * Другие названия для поиска плюс полное название, если в карточке оно короче: «Лира-Сапр»
 * по-прежнему находит LIRA-FEM.
 * @param {string | null | undefined} aliases
 * @param {string} title
 */
export function withTitleAlias(aliases, title) {
  const plain = plainTitle(title)
  const all = [aliases, plain === title ? null : title, ...collectionAliases(plain)].filter(Boolean)
  return all.length ? all.join(', ') : null
}

/**
 * Коллекции Autodesk ищут сокращением: «Architecture Engineering & Construction Collection» —
 * AEC, «Product Design & Manufacturing Collection» — PDMC, плюс «коллекция»
 * (замечание владельца 03.11.2026: «aec» ничего не находил).
 * @param {string} title
 * @returns {string[]}
 */
export function collectionAliases(title) {
  const match = /^(.+?)\s+Collection$/i.exec(title.trim())
  if (!match?.[1]) return []
  const letters = match[1]
    .split(/[\s&]+/)
    .filter((word) => /^[A-Z]/.test(word))
    .map((word) => word[0])
    .join('')
  if (letters.length < 2) return []
  return [`${letters} Collection`, `${letters}C`, `коллекция ${letters}`]
}
