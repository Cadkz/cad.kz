/**
 * Подборки «Похожие» и «С этим покупают»: чистые функции без базы.
 *
 * Похожие — товары из тех же разделов: совпадение основного раздела важнее всего, потом общие
 * разделы, производитель и тип. «С этим покупают» — товары из разделов, которые у раздела товара
 * указаны в «С этим покупают: предлагать товары из разделов» (к плоттерам — расходники,
 * к программам — курсы), а также плагины и базовые программы (поле «Требуется базовое ПО»).
 * Ручные списки товара всегда первые. Галочки товара разрешают предлагать его в чужих подборках.
 */

/**
 * @typedef {{ id: number, title: string, vendor: string | null, kind: string,
 *   main: number | null, sections: number[], requires: number[],
 *   manualSimilar: number[], manualCross: number[],
 *   suggestSimilar: boolean, suggestCross: boolean }} RecItem
 * @typedef {Map<number, { isDirection: boolean, cross: number[] }>} SectionInfo
 */

const MANUAL = 100

/** Детерминированный «разброс» при равных баллах, чтобы у соседних товаров подборки различались. */
function spread(a, b) {
  let hash = 2166136261
  for (const char of `${a}:${b}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return hash >>> 0
}

const intersects = (a, b) => a.some((value) => b.includes(value))

function directions(item, info) {
  return item.sections.filter((id) => info.get(id)?.isDirection)
}

/** Отсортированные по баллам ID; seed разносит равные баллы по-разному для разных товаров. */
function top(scores, limit, seed) {
  return [...scores]
    .sort(([a, sa], [b, sb]) => sb - sa || spread(seed, a) - spread(seed, b))
    .slice(0, limit)
    .map(([id]) => id)
}

/**
 * Похожие товары.
 * @param {RecItem} target
 * @param {RecItem[]} items все опубликованные товары
 * @param {{ limit?: number, exclude?: Iterable<number> }} [options]
 * @returns {number[]} ID товаров по порядку показа
 */
export function similarFor(target, items, { limit = 3, exclude = [] } = {}) {
  const skip = new Set([target.id, ...exclude])
  const byId = new Map(items.map((item) => [item.id, item]))
  const scores = new Map()
  target.manualSimilar.forEach((id, index) => {
    if (!skip.has(id) && byId.has(id)) scores.set(id, MANUAL - index)
  })
  for (const item of items) {
    if (skip.has(item.id) || scores.has(item.id) || !item.suggestSimilar) continue
    const shared = item.sections.filter((id) => target.sections.includes(id)).length
    const sameMain = target.main != null && item.main === target.main
    // Сканер и программа могут делить второй раздел, но похожими от этого не становятся.
    if (!shared || (!sameMain && item.kind !== target.kind)) continue
    const score =
      (sameMain ? 4 : 0) +
      2 * shared +
      (target.vendor && item.vendor === target.vendor ? 1 : 0) +
      (item.kind === target.kind ? 1 : 0)
    scores.set(item.id, score)
  }
  return top(scores, limit, target.id)
}

/**
 * Балл одного кандидата в «С этим покупают» или null, если он не подходит.
 * @param {RecItem} target
 * @param {RecItem} item
 * @param {{ crossSections: number[], targetDirections: number[], info: SectionInfo }} ctx
 */
function crossScore(target, item, { crossSections, targetDirections, info }) {
  const plugin = item.requires.includes(target.id) || target.requires.includes(item.id)
  const inCross = intersects(item.sections, crossSections)
  if (!plugin && !inCross) return null
  const itemDirections = directions(item, info)
  const sameDirection = intersects(itemDirections, targetDirections)
  // Курс по ЛИРА не предлагаем к GEO5: у обоих есть направление, и оно разное.
  if (!plugin && itemDirections.length && targetDirections.length && !sameDirection) return null
  return (
    (plugin ? 6 : 0) +
    (inCross ? 3 : 0) +
    (sameDirection ? 2 : 0) +
    (target.vendor && item.vendor === target.vendor ? 1 : 0)
  )
}

/**
 * Баллы «С этим покупают» для одного товара: ручной список, затем подбор по разделам.
 * @param {RecItem} target
 * @param {RecItem[]} items
 * @param {SectionInfo} info
 * @param {Set<number>} skip
 */
function crossScores(target, items, info, skip) {
  const byId = new Map(items.map((item) => [item.id, item]))
  const scores = new Map()
  target.manualCross.forEach((id, index) => {
    if (!skip.has(id) && byId.has(id)) scores.set(id, MANUAL - index)
  })
  const ctx = {
    crossSections: target.sections.flatMap((id) => info.get(id)?.cross ?? []),
    targetDirections: directions(target, info),
    info,
  }
  for (const item of items) {
    if (skip.has(item.id) || scores.has(item.id) || !item.suggestCross) continue
    const score = crossScore(target, item, ctx)
    if (score != null) scores.set(item.id, score)
  }
  return scores
}

/**
 * «С этим покупают» для одного или нескольких товаров (страница товара, корзина).
 * @param {RecItem[]} targets
 * @param {RecItem[]} items
 * @param {SectionInfo} info
 * @param {{ limit?: number, exclude?: Iterable<number> }} [options]
 * @returns {number[]}
 */
export function crossFor(targets, items, info, { limit = 3, exclude = [] } = {}) {
  const skip = new Set([...targets.map((t) => t.id), ...exclude])
  const total = new Map()
  for (const target of targets)
    for (const [id, score] of crossScores(target, items, info, skip))
      total.set(id, (total.get(id) ?? 0) + score)
  return top(total, limit, targets.map((t) => t.id).join(','))
}
