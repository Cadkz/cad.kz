// @ts-check
/**
 * Задачи GEO5 для фильтра каталога «Уточнить по задачам» (catalog-setup:geo5-catalog-v1,
 * замечание владельца 12.10.2026): девять решений как на geo5.kz вместо трёх задач черновика.
 * Программам GEO5 — точно по списку владельца (TASK_PROGRAMS), пакетам — по их короткому названию.
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

/**
 * Программы GEO5 по задачам — список владельца с geo5.kz (12.10.2026). Одна программа может
 * решать несколько задач (МКЭ, Стратиграфия, Выработка).
 * @type {Record<string, string[]>}
 */
export const TASK_PROGRAMS = {
  [STABILITY]: [
    'Устойчивость откоса',
    'Стабилизирующая свая',
    'Нагельное крепление',
    'Устойчивость откоса - Фильтрация',
    'Скальный откос',
    'Армированные насыпи',
    'МКЭ',
    'МКЭ - Фильтрация',
  ],
  [SHORING]: ['Ограждения котлованов - анализ', 'Ограждения котлованов - проект', 'МКЭ'],
  [WALLS]: [
    'Уголковая стена',
    'Гравитационная стена',
    'Армированная стена',
    'Давление грунта',
    'Армированные насыпи',
    'Нагельное крепление',
    'Габион',
    'Сборная стена',
    'Устой',
    'Стена Redi-Rock',
  ],
  [SHALLOW]: ['Отдельные фундаменты', 'Отдельные фундаменты - СРТ', 'Балка', 'Плита'],
  [PILES]: ['Сваи', 'Куст свай', 'Свая СРТ', 'Микросвая'],
  [SETTLEMENT]: ['Осадка', 'МКЭ', 'МКЭ - Консолидация', 'Выработка'],
  [TUNNELS]: ['МКЭ', 'МКЭ - Тоннель', 'МКЭ - Землетрясение', 'Выработка', 'Шахта'],
  [MODELLING]: ['Стратиграфия', 'Стратиграфия - Земляные работы', 'Облако точек', 'Data Collector'],
  [SURVEY]: [
    'Стратиграфия',
    'Стратиграфия - Таблицы',
    'Стратиграфия - Разрезы',
    'Облако точек',
    'Лаборатория',
    'Data Collector',
  ],
}

// Латинские буквы, похожие на русские (СРТ и CPT пишут по-разному), — к русским.
const LOOKALIKE = {
  a: 'а',
  c: 'с',
  e: 'е',
  k: 'к',
  m: 'м',
  o: 'о',
  p: 'р',
  t: 'т',
  x: 'х',
  b: 'в',
  h: 'н',
}

/**
 * Название программы для сравнения: без «GEO5», регистра, ё, тире и похожих латинских букв.
 * @param {string} title
 */
export function programKey(title) {
  return title
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/^\s*(geo\s*5|гео\s*5)\s*/i, '')
    .replace(/[a-z]/g, (ch) => LOOKALIKE[/** @type {keyof typeof LOOKALIKE} */ (ch)] ?? ch)
    .replace(/[^0-9a-zа-я]+/g, ' ')
    .trim()
}

/** Ключ программы → её задачи (в порядке geo5.kz). @type {Map<string, string[]>} */
const BY_PROGRAM = new Map()
for (const task of GEO5_TASKS)
  for (const name of TASK_PROGRAMS[task] ?? []) {
    const key = programKey(name)
    BY_PROGRAM.set(key, [...(BY_PROGRAM.get(key) ?? []), task])
  }

/**
 * Задачи отдельной программы GEO5 по названию — точно по списку владельца. Нет в списке — пусто.
 * @param {string} title
 * @returns {string[]}
 */
export function geoModuleTasks(title) {
  return BY_PROGRAM.get(programKey(title)) ?? []
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
