// @ts-check
/**
 * Блок «О программах» на странице семейства: у ПАССАТ семь программ с одним и тем же описанием,
 * и у всех короткий заголовок «ПАССАТ» — выходило пять одинаковых строк. Правила:
 * - одинаковое описание показывается один раз, заголовок — самый частый короткий заголовок группы;
 * - если заголовки разных описаний совпали, у них полное название программы.
 */

/**
 * @typedef {{ id: number, title: string, label: string, description: string,
 *   href: string | null }} AboutMember
 * @typedef {{ key: number, heading: string, description: string, href: string | null }} AboutEntry
 */

/** @param {string} text */
const sameText = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase()

/**
 * @param {AboutMember[]} members программы с описанием, в порядке страницы
 * @returns {AboutEntry[]}
 */
export function aboutEntries(members) {
  /** @type {Map<string, AboutMember[]>} */
  const groups = new Map()
  for (const member of members) {
    const key = sameText(member.description)
    if (!key) continue
    groups.set(key, [...(groups.get(key) ?? []), member])
  }
  const entries = [...groups.values()].map((group) => {
    const [first] = group
    if (!first) throw new Error('пустая группа')
    /** @type {Map<string, number>} */
    const counts = new Map()
    for (const member of group) counts.set(member.label, (counts.get(member.label) ?? 0) + 1)
    // Самый частый заголовок; при равенстве — первый по порядку страницы.
    let heading = first.label
    for (const member of group)
      if ((counts.get(member.label) ?? 0) > (counts.get(heading) ?? 0)) heading = member.label
    return {
      key: first.id,
      heading,
      full: first.title,
      description: first.description,
      // Ссылка на свою страницу — только если описание у одной программы.
      href: group.length === 1 ? first.href : null,
    }
  })
  /** @type {Map<string, number>} */
  const used = new Map()
  for (const entry of entries) used.set(entry.heading, (used.get(entry.heading) ?? 0) + 1)
  return entries.map(({ key, heading, full, description, href }) => ({
    key,
    heading: (used.get(heading) ?? 0) > 1 ? full : heading,
    description,
    href,
  }))
}
