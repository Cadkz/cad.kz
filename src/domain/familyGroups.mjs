// @ts-check
/**
 * Программы семейства по задачам (замечание владельца 27.10.2026: «в геотехнике SCAD → сателлиты,
 * а там 15 карточек, пока дойдёшь до геотехнической»). Большое семейство (сателлиты SCAD)
 * делится на группы с иконкой: основания и фундаменты, железобетон, металл, дерево и камень,
 * нагрузки, сечения. Пришли из направления (?task=geotech) — его группа первой.
 * Чистые функции без базы.
 */

/** С какого размера семейство делится на группы: маленькие читаются и одним списком. */
export const GROUP_FROM = 8

/**
 * Группы по порядку проверки: первая подошедшая забирает программу.
 * @type {{ key: string, title: string, icon: string, match: RegExp, direction?: string }[]}
 */
export const TASK_GROUPS = [
  {
    key: 'geotech',
    title: 'Основания и фундаменты',
    icon: 'mountain',
    match: /основани|фундамент|грунт|откос|склон|свай|винклер|котлован/i,
    direction: 'geotech',
  },
  {
    key: 'concrete',
    title: 'Железобетон',
    icon: 'brick',
    match: /железобетон|ж\/б|армат|монолит|перекрыт/i,
  },
  {
    key: 'steel',
    title: 'Металлоконструкции',
    icon: 'columns',
    match: /стальн|металлическ|холодногнут|металл/i,
  },
  { key: 'timber', title: 'Дерево и камень', icon: 'tree', match: /деревян|древесин|камен|кладк/i },
  { key: 'loads', title: 'Нагрузки', icon: 'wind', match: /нагрузк|ветер|снег|сейсм/i },
  { key: 'sections', title: 'Сечения', icon: 'shapes', match: /сечени/i },
]

/** Всё, что не подошло ни в одну группу. */
export const OTHER_GROUP = { key: 'other', title: 'Другие программы', icon: 'cog' }

/**
 * Делит программы на группы по задаче. null — делить не нужно (мало программ или одна группа).
 * @template T
 * @param {T[]} items
 * @param {(item: T) => string} textOf название и описание программы
 * @param {string | null} [task] направление, из которого пришли (slug)
 * @returns {{ key: string, title: string, icon: string, items: T[] }[] | null}
 */
export function groupByTask(items, textOf, task = null) {
  if (items.length < GROUP_FROM) return null
  /** @type {Map<string, T[]>} */
  const byKey = new Map()
  for (const item of items) {
    const text = textOf(item)
    const key = TASK_GROUPS.find((group) => group.match.test(text))?.key ?? OTHER_GROUP.key
    byKey.set(key, [...(byKey.get(key) ?? []), item])
  }
  const groups = [...TASK_GROUPS, OTHER_GROUP].flatMap((group) => {
    const list = byKey.get(group.key)
    return list?.length
      ? [{ key: group.key, title: group.title, icon: group.icon, items: list }]
      : []
  })
  if (groups.length < 2) return null
  const first = TASK_GROUPS.find((group) => group.direction && group.direction === task)?.key
  return first
    ? [...groups.filter((g) => g.key === first), ...groups.filter((g) => g.key !== first)]
    : groups
}

/**
 * Ссылка на семейство из направления: ?task=<направление>, чтобы его группа была первой.
 * @param {string} href
 * @param {string | null | undefined} direction
 */
export function familyTaskHref(href, direction) {
  if (!direction || !href.startsWith('/families/') || href.includes('?')) return href
  const [path, hash] = href.split('#')
  return `${path}?task=${encodeURIComponent(direction)}${hash ? `#${hash}` : ''}`
}
