// @ts-check
/**
 * Девять направлений сеткой 3 × 3 (решение владельца 27.10.2026: «каталог перегружен, оставить
 * только 9 карточек»). Семь направлений программ и две плитки-входа («Оборудование»,
 * «Обучение и внедрение», src/lib/siteNav.ts).
 * - «Визуализация» влита в «САПР, BIM и визуализация»: 3ds Max, V-Ray и Chaos в Казахстане
 *   покупают в основном архитекторы и дизайнеры интерьеров — те же люди, что Revit и AutoCAD.
 * - «Промышленные объекты и трубопроводы» влиты в «Инженерные сети и трубопроводы»: НТП
 *   Трубопровод и Model Studio CS и так стояли в обоих.
 * Описания — для каких задач программы раздела, без перечисления самих программ.
 * Чистые данные и функции без базы; применяет src/lib/directionsSetup.ts.
 */

/** Влитые разделы: старый → новый. Тот же список — у старых ссылок каталога (catalogFilter). */
export const MERGED_DIRECTIONS = /** @type {const} */ ({ viz: 'arch', pipes: 'mep' })

/**
 * Порядок направлений программ (решение владельца 27.10.2026: «сметы ни в коем случае не первыми,
 * приоритет — AutoCAD, потом конструкторское, геотехника, сметы, машиностроение»). Один порядок
 * на главной, в каталоге, в фильтре и в меню — поле «Порядок вывода» раздела.
 * @type {Record<string, number>}
 */
export const DIRECTION_ORDER = {
  arch: 10,
  structural: 20,
  geotech: 30,
  estimate: 40,
  machine: 50,
  infra: 60,
  mep: 70,
}

/**
 * Название и описание карточки у каждого направления программ.
 * @type {Record<string, { title?: string, summary: string }>}
 */
export const DIRECTION_TEXTS = {
  estimate: {
    summary: 'Сметы, расчёт стоимости строительства и проектных работ по нормативам РК.',
  },
  arch: {
    title: 'САПР, BIM и визуализация',
    summary: 'Чертежи, информационная модель здания, совместная работа над проектом и рендеры.',
  },
  structural: {
    summary: 'Расчёт каркасов зданий, подбор сечений и армирования по СП РК и Еврокодам.',
  },
  geotech: {
    summary: 'Фундаменты, сваи, подпорные стены, котлованы и устойчивость склонов.',
  },
  machine: {
    summary: 'Детали и сборки в 3D, чертежи, инженерный анализ и подготовка производства.',
  },
  infra: {
    summary: 'Изыскания, генплан, автомобильные и железные дороги, наружные сети.',
  },
  mep: {
    title: 'Инженерные сети и трубопроводы',
    summary: 'Отопление, вентиляция, водоснабжение, электрика и технологические трубопроводы.',
  },
}

/**
 * Разделы товара или правила после слияния: влитые заменены новыми, без повторов, основной
 * не дублируется в дополнительных.
 * @param {number | null} main
 * @param {number[]} extra
 * @param {Map<number, number>} moves  id влитого раздела → id нового
 * @returns {{ main: number | null, extra: number[], changed: boolean }}
 */
export function remapSections(main, extra, moves) {
  const to = (/** @type {number} */ id) => moves.get(id) ?? id
  const nextMain = main == null ? null : to(main)
  const nextExtra = [...new Set(extra.map(to))].filter((id) => id !== nextMain)
  const changed =
    nextMain !== main ||
    nextExtra.length !== extra.length ||
    nextExtra.some((id, index) => id !== extra[index])
  return { main: nextMain, extra: nextExtra, changed }
}
