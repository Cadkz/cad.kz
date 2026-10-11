// @ts-check
/**
 * Подразделы каталога: у раздела может быть «Родительский раздел». В меню, фильтре и на главной
 * виден только верхний раздел, товары подразделов показываются в нём. Так «Плоттеры»,
 * «Широкоформатные сканеры» и «Расходные материалы» стали одним пунктом «Широкоформатная печать
 * и сканирование» (документ по CRM, 12.10.2026), а подборки «Похожие» и «С этим покупают»
 * по-прежнему различают плоттер и тонер. Чистые функции без базы.
 */

/**
 * @template {string | number} K
 * @typedef {{ id: K, parent?: K | null }} TreeSection
 */

/**
 * Верхний раздел для каждого раздела (у верхнего — он сам). Цикл в родителях не зацикливает:
 * обход останавливается на уже встреченном разделе.
 * @template {string | number} K
 * @param {TreeSection<K>[]} sections
 * @returns {Map<K, K>}
 */
export function topSections(sections) {
  const parentOf = new Map(sections.map((s) => [s.id, s.parent ?? null]))
  /** @type {Map<K, K>} */
  const top = new Map()
  for (const section of sections) {
    let current = section.id
    const seen = new Set([current])
    for (;;) {
      const parent = parentOf.get(current)
      if (parent == null || !parentOf.has(parent) || seen.has(parent)) break
      seen.add(parent)
      current = parent
    }
    top.set(section.id, current)
  }
  return top
}

/**
 * Разделы товара для меню и фильтра: свои и их верхние, без повторов. Свой подраздел
 * остаётся в списке, чтобы старые ссылки с ним (?type=consumables) продолжали работать.
 * @template {string | number} K
 * @param {K[]} own
 * @param {Map<K, K>} top
 * @returns {K[]}
 */
export function withTopSections(own, top) {
  return [...new Set(own.flatMap((id) => [top.get(id) ?? id, id]))]
}

/**
 * Группа меню товара: по типу, но программа с основным разделом оборудования (ReCap и Geomagic
 * в «3D-сканировании») показывается среди оборудования, рядом со сканерами.
 * @param {string} kind
 * @param {string | null | undefined} mainGroup группа меню основного раздела
 * @returns {'software' | 'hardware' | 'service'}
 */
export function itemGroup(kind, mainGroup) {
  if (kind === 'course' || kind === 'service') return 'service'
  if (kind === 'hardware') return 'hardware'
  return mainGroup === 'hardware' ? 'hardware' : 'software'
}
