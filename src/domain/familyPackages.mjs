/**
 * Семейство программ (ПАССАТ, СТАРТ и т. п.): пакеты, в которые уже входят другие программы
 * семейства, и подписи строк, которые не повторяются.
 */

/** Сравнение названий без регистра, пробелов, дефисов и знаков: «ПАССАТ - базовый» = «ПАССАТ-Базовый». */
const norm = (/** @type {string} */ s) =>
  s
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]/g, '')

/**
 * Какие программы входят в пакет: пакет — товар, в названии которого перечислены минимум
 * две другие программы семейства («ПАССАТ модули: ПАССАТ-Базовый, ПАССАТ-Колонны…»).
 * Одно совпадение — не пакет: «ПАССАТ - базовый» содержит слово «ПАССАТ», но это модуль.
 * @param {{ key: string, title: string }[]} items
 * @returns {Map<string, string[]>}  ключ пакета → ключи входящих в него программ
 */
export function familyIncludes(items) {
  /** @type {Map<string, string[]>} */
  const result = new Map()
  for (const pkg of items) {
    const name = norm(pkg.title)
    const inside = items.filter(
      (other) =>
        other.key !== pkg.key &&
        norm(other.title).length >= 4 &&
        norm(other.title).length < name.length &&
        name.includes(norm(other.title)),
    )
    if (inside.length >= 2)
      result.set(
        pkg.key,
        inside.map((other) => other.key),
      )
  }
  return result
}

/**
 * Подпись строки: короткое начало названия («ПАССАТ» из «ПАССАТ - базовый»), но если такое же
 * начало у нескольких программ — полное название, иначе в итоге и заявке пять одинаковых «ПАССАТ».
 * @param {{ label: string, note: string | null, title: string }[]} parts
 * @returns {{ label: string, note: string | null }[]}
 */
export function uniqueLabels(parts) {
  const count = new Map()
  for (const p of parts) count.set(norm(p.label), (count.get(norm(p.label)) ?? 0) + 1)
  return parts.map((p) =>
    count.get(norm(p.label)) > 1
      ? { label: p.title, note: null }
      : { label: p.label, note: p.note },
  )
}
