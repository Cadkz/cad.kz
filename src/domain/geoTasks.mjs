// @ts-check
/**
 * Задачи GEO5 для фильтра каталога «Уточнить по задачам» (catalog-setup:geo5-catalog-v1,
 * замечание владельца 12.10.2026): девять решений как на geo5.kz вместо трёх задач черновика.
 * Задачи ставятся отдельным программам GEO5 по названию, пакетам — по их короткому названию.
 * Дальше всё правится в админке: у программы — «Для каких задач», у пакета — «Задачи для фильтра».
 */

export const STABILITY = 'Расчёт устойчивости'
export const SHORING = 'Ограждающие конструкции'
export const WALLS = 'Подпорные стены'
export const SHALLOW = 'Фундаменты мелкого заложения'
export const PILES = 'Свайные фундаменты'
export const SETTLEMENT = 'Расчёт осадки'
export const TUNNELS = 'Тоннели и шахты'
export const MODELLING = 'Геологическое моделирование'
export const SURVEY = 'Инженерно-геологические изыскания'

/** Все девять — в порядке geo5.kz. */
export const GEO5_TASKS = [
  STABILITY,
  SHORING,
  WALLS,
  SHALLOW,
  PILES,
  SETTLEMENT,
  TUNNELS,
  MODELLING,
  SURVEY,
]

/** Правила для отдельных программ GEO5: слово в названии → задача. */
const MODULE_RULES = [
  { task: STABILITY, match: /откос|устойчив|армированн|скальн|МКЭ/i },
  { task: SHORING, match: /огражден|шпунт|анкер|стена в грунте|котлован/i },
  { task: WALLS, match: /подпорн|уголков|гравитац|габион|консольн|сборн|массивн/i },
  { task: PILES, match: /сва[йияюе]|микросва/i },
  { task: SETTLEMENT, match: /осадк|консолидац|МКЭ/i },
  { task: TUNNELS, match: /тоннел|туннел|шахт|подземн/i },
  { task: MODELLING, match: /стратиграф|земляные работы|рельеф|геологическ\S* модел/i },
  { task: SURVEY, match: /изыскан|зондир|лаборатор|скважин|разрез|полев/i },
]

/**
 * Задачи отдельной программы GEO5 по названию. «Фундамент» без свай — мелкое заложение.
 * @param {string} title
 * @returns {string[]}
 */
export function geoModuleTasks(title) {
  const tasks = MODULE_RULES.filter((rule) => rule.match.test(title)).map((rule) => rule.task)
  if (/фундамент|плит[аы]|ленточн/i.test(title) && !tasks.includes(PILES)) tasks.push(SHALLOW)
  return GEO5_TASKS.filter((task) => tasks.includes(task))
}

/** Пакеты GEO5 (короткое название варианта в подборе) → задачи. */
const PACKAGE_RULES = [
  { match: /профессионал/i, tasks: GEO5_TASKS },
  { match: /базов/i, tasks: [STABILITY, SHORING, WALLS, SHALLOW, PILES, SETTLEMENT] },
  { match: /основани/i, tasks: [SHALLOW, PILES, SETTLEMENT] },
  { match: /подпорн/i, tasks: [WALLS] },
  { match: /огражден/i, tasks: [SHORING] },
  { match: /геолог/i, tasks: [MODELLING, SURVEY] },
]

/**
 * @param {string} label
 * @returns {string[]}
 */
export function geoPackageTasks(label) {
  return PACKAGE_RULES.find((rule) => rule.match.test(label))?.tasks ?? []
}

/** Задачи в шапке страницы GEO5 (3–4 пункта) — тоже из девяти, чтобы фильтр был единым. */
export const GEO5_MAIN_TASKS = [STABILITY, WALLS, PILES, MODELLING]

/** Задачи черновика 10.10.2026: меняем, только если их не правили в админке. */
export const GEO5_OLD_TASKS = [
  'Подпорные стены и котлованы',
  'Фундаменты и сваи',
  'Устойчивость откосов, МКЭ',
]
