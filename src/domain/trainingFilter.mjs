// @ts-check
/**
 * Фильтры обучения в каталоге (просьба владельца 30.10.2026, вечер): направление курса, месяц
 * старта, «Есть набор» и порядок «Ближайший старт». Старты — из расписания УЦ (поле starts у
 * курса, src/lib/catalog.ts). Работают только в разделе «Обучение» (src/lib/catalogFilter.ts).
 * Чистые функции без React.
 */
import { astanaToday, dayText } from './courseSchedule.mjs'
import { COURSE_TOPICS, OTHER_TOPIC, topicOrder } from './courseTopics.mjs'

/**
 * @typedef {{ title: string, topic?: string, starts?: string[] }} TrainingItem
 * @typedef {'topic' | 'start'} TrainingSort
 * @typedef {object} TrainingState
 * @property {string | null} topic  Направление курса (ключ категории из courseTopics.mjs).
 * @property {string | null} month  Месяц старта, ГГГГ-ММ.
 * @property {boolean} open  Только курсы с открытым набором.
 * @property {TrainingSort} sort  По направлениям (группами) или ближайший старт первым.
 * @typedef {'topic' | 'month' | 'open'} TrainingKey
 * @typedef {{ value: string, label: string, count: number }} Option
 */

/** @type {TrainingState} */
export const emptyTraining = { topic: null, month: null, open: false, sort: 'topic' }

const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]

/**
 * «2026-12» → «Декабрь»; другой год, чем у первого месяца списка, — «Январь 2027».
 * @param {string} month
 * @param {string} firstYear
 */
export function monthLabel(month, firstYear) {
  const [year, number] = month.split('-')
  const name = MONTHS[Number(number) - 1] ?? month
  return year === firstYear ? name : `${name} ${year}`
}

const itemTopic = (/** @type {TrainingItem} */ item) => item.topic ?? OTHER_TOPIC.key

/**
 * Подходит ли курс под выбор обучения; ignore — группа, для которой считаются варианты.
 * @param {TrainingItem} item
 * @param {TrainingState} state
 * @param {TrainingKey} [ignore]
 */
export function trainingMatch(item, state, ignore) {
  const starts = item.starts ?? []
  if (ignore !== 'topic' && state.topic && itemTopic(item) !== state.topic) return false
  const month = state.month
  if (ignore !== 'month' && month && !starts.some((day) => day.startsWith(month))) return false
  if (ignore !== 'open' && state.open && !starts.length) return false
  return true
}

/**
 * Первый старт курса: в выбранном месяце, если месяц выбран.
 * @param {TrainingItem} item
 * @param {string | null} month
 */
export function firstStart(item, month) {
  const starts = item.starts ?? []
  return (month ? starts.find((day) => day.startsWith(month)) : starts[0]) ?? null
}

/**
 * Подпись на карточке курса: «Старт 1 декабря».
 * @param {TrainingItem} item
 * @param {string | null} month
 */
export function startNote(item, month) {
  const day = firstStart(item, month)
  return day ? `Старт ${dayText(day, astanaToday())}` : null
}

/**
 * Ближайший старт первым, курсы без групп — в конце, дальше по названию.
 * @param {string | null} month
 */
export function byStart(month) {
  return (/** @type {TrainingItem} */ a, /** @type {TrainingItem} */ b) =>
    (firstStart(a, month) ?? '9').localeCompare(firstStart(b, month) ?? '9') ||
    a.title.localeCompare(b.title, 'ru', { numeric: true })
}

/**
 * Варианты фильтров обучения. scope(key) — курсы раздела при всех остальных условиях, кроме этой
 * группы: пустые варианты скрыты, выбранный — нет.
 * @param {(key: TrainingKey) => TrainingItem[]} scope
 * @param {TrainingState} state
 * @returns {{ topics: Option[], months: Option[], open: number }}
 */
export function trainingOptions(scope, state) {
  /** @type {Map<string, number>} */
  const topicCounts = new Map()
  for (const item of scope('topic'))
    topicCounts.set(itemTopic(item), (topicCounts.get(itemTopic(item)) ?? 0) + 1)
  const titles = new Map([
    ...COURSE_TOPICS.map((topic) => /** @type {[string, string]} */ ([topic.key, topic.title])),
    [OTHER_TOPIC.key, OTHER_TOPIC.title],
  ])
  const topics = [...new Set([...topicCounts.keys(), ...(state.topic ? [state.topic] : [])])]
    .sort((a, b) => topicOrder(a) - topicOrder(b))
    .map((key) => ({
      value: key,
      label: titles.get(key) ?? OTHER_TOPIC.title,
      count: topicCounts.get(key) ?? 0,
    }))
  /** @type {Map<string, number>} */
  const monthCounts = new Map()
  for (const item of scope('month'))
    for (const month of new Set((item.starts ?? []).map((day) => day.slice(0, 7))))
      monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1)
  const monthKeys = [...new Set([...monthCounts.keys(), ...(state.month ? [state.month] : [])])]
    .sort()
    .slice(0, 12)
  const firstYear = monthKeys[0]?.slice(0, 4) ?? ''
  return {
    // Одно направление ничего не уточняет.
    topics: topics.length > 1 || state.topic ? topics : [],
    months: monthKeys.map((month) => ({
      value: month,
      label: monthLabel(month, firstYear),
      count: monthCounts.get(month) ?? 0,
    })),
    open: scope('open').filter((item) => item.starts?.length).length,
  }
}

/**
 * Выбор обучения из адреса: ?topic=bim&month=2026-12&open=1&sort=start.
 * @param {(key: string) => string | null} one
 * @returns {TrainingState}
 */
export function trainingFromParams(one) {
  const month = one('month')
  return {
    topic: one('topic'),
    month: month && /^\d{4}-\d{2}$/.test(month) ? month : null,
    open: one('open') === '1',
    sort: one('sort') === 'start' ? 'start' : 'topic',
  }
}

/**
 * @param {TrainingState} state
 * @param {URLSearchParams} query
 */
export function trainingToQuery(state, query) {
  if (state.topic) query.set('topic', state.topic)
  if (state.month) query.set('month', state.month)
  if (state.open) query.set('open', '1')
  if (state.sort === 'start') query.set('sort', 'start')
}
