// @ts-check
/**
 * Обучение по категориям (замечание владельца 27.10.2026: «курсы вперемешку — много букв
 * и ничего непонятно»). Категория курса — по программе в названии, если программы нет — по
 * направлению курса в админке. От категории — иллюстрация курса (public/images/courses, ключ
 * «course-<категория>», src/domain/sectionArt.mjs). Одно правило для каталога и меню.
 * Чистые функции без базы.
 */

/**
 * Категории в порядке вывода. match — слова названия; direction — направление курса в админке.
 * Порядок проверки — PICK_ORDER: «Revit MEP» — инженерные сети, а не BIM; «Civil 3D … сетей» —
 * дороги и генплан.
 * @typedef {{ key: string, title: string, icon: string, match: RegExp, directions: string[] }} CourseTopic
 * @type {CourseTopic[]}
 */
export const COURSE_TOPICS = [
  {
    key: 'bim',
    title: 'BIM и архитектура',
    icon: 'course-bim',
    match: /revit|bim|archicad|autocad|navisworks|nanocad|спдс/i,
    directions: ['arch'],
  },
  {
    key: 'structural',
    title: 'Расчёт конструкций',
    icon: 'course-structural',
    match: /lira|лира|scad|скад|robot|advance steel|еврокод|сп рк en|мономах/i,
    directions: ['structural', 'geotech'],
  },
  {
    key: 'infra',
    title: 'Дороги, генплан и изыскания',
    icon: 'course-infra',
    match: /civil\s*3d|subassembly|infraworks|генплан|дорог|изыскан|геодез/i,
    directions: ['infra'],
  },
  {
    key: 'mep',
    title: 'Инженерные сети',
    icon: 'course-mep',
    match: /\bmep\b|magicad|model studio|трубопровод|вентиляц|слаботоч|электро/i,
    directions: ['mep'],
  },
  {
    key: 'viz',
    title: 'Визуализация',
    icon: 'course-viz',
    match: /3ds\s*max|v-?ray|unreal|визуализ|corona/i,
    directions: [],
  },
  {
    key: 'corporate',
    title: 'Корпоративное обучение',
    icon: 'course-corporate',
    match: /корпоратив/i,
    directions: [],
  },
]

/** Курсы, которые ни под что не подошли. */
export const OTHER_TOPIC = /** @type {const} */ ({
  key: 'other',
  title: 'Другие курсы',
  icon: 'course-other',
})

/** Порядок проверки названия: частные случаи раньше общих. */
const PICK_ORDER = ['corporate', 'viz', 'infra', 'structural', 'mep', 'bim']

/**
 * Категория курса.
 * @param {string} title название курса
 * @param {string[]} [directions] направления курса (slug) из админки
 * @returns {{ key: string, title: string, icon: string }}
 */
export function courseTopic(title, directions = []) {
  const byKey = new Map(COURSE_TOPICS.map((topic) => [topic.key, topic]))
  for (const key of PICK_ORDER) {
    const topic = byKey.get(key)
    if (topic?.match.test(title)) return { key: topic.key, title: topic.title, icon: topic.icon }
  }
  const byDirection = COURSE_TOPICS.find((topic) =>
    topic.directions.some((slug) => directions.includes(slug)),
  )
  return byDirection
    ? { key: byDirection.key, title: byDirection.title, icon: byDirection.icon }
    : { ...OTHER_TOPIC }
}

/**
 * Номер категории для сортировки групп: по порядку COURSE_TOPICS, «Другие» — последними.
 * @param {string} key
 */
export function topicOrder(key) {
  const index = COURSE_TOPICS.findIndex((topic) => topic.key === key)
  return index === -1 ? COURSE_TOPICS.length : index
}

/**
 * Иллюстрация категории курса (пачка владельца 03.11.2026, «CAD-kz-education-services»): файл
 * public/images/courses/<key>.webp, 256 × 256. Неизвестная категория — «Другие курсы».
 * @param {string} key
 */
export function courseArtUrl(key) {
  const known = COURSE_TOPICS.some((topic) => topic.key === key)
  return `/images/courses/${known ? key : OTHER_TOPIC.key}.webp`
}
