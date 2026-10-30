// @ts-check
/**
 * Курсы сайта по таблице «Расписание курсов» УЦ (просьба владельца 30.10.2026, вечер): при каждом
 * чтении таблицы сайт сам ставит цены курсов из таблицы (на сайте — вниз до тысячи, это делает
 * src/domain/pricing.mjs при показе) и заводит курсы, которых на сайте нет. Здесь — только план:
 * что поменять. Записывает src/lib/courseSync.ts. Чистые функции без базы и сети.
 */
import { upcoming } from './courseSchedule.mjs'

/** @typedef {import('./courseSchedule.mjs').CourseProgram} CourseProgram */
/** @typedef {import('./courseSchedule.mjs').CourseGroup} CourseGroup */

/** Номер программы на l-p.kz из ссылки «Программа курса»: detail.php?ID=2934 → «2934». */
export function lpId(/** @type {string} */ link) {
  return /[?&]ID=(\d+)/i.exec(link)?.[1] ?? null
}

/** Ключ курса, заведённого по таблице (поле «Уникальный ключ импорта»): «lp-course-2934». */
export function lpKey(/** @type {string} */ id) {
  return `lp-course-${id}`
}

/** Номер программы l-p.kz из ключа курса; не наш ключ — null. */
export function lpIdFromKey(/** @type {string | null | undefined} */ key) {
  return /^lp-course-(\d+)$/.exec(key ?? '')?.[1] ?? null
}

/** Комплектация курса, которую сайт заводит сам (как кнопка «Взять цены из таблицы» раньше). */
export const COURSE_OFFER = {
  configuration: 'Обучение одного слушателя',
  license: 'Онлайн-курс',
}

/**
 * Курс ещё актуален: есть неотменённый запуск, который не закончился (или ещё не начался).
 * Курсы только с прошедшими и отменёнными запусками сайт сам не заводит.
 * @param {CourseGroup[]} groups
 * @param {string} today ГГГГ-ММ-ДД
 */
export function isAlive(groups, today) {
  return groups.some((group) => group.status !== 'cancelled' && (group.end || group.start) >= today)
}

/**
 * Цена курса по таблице: ближайшего запуска с открытым набором, иначе — цена программы.
 * @param {CourseProgram[]} own все программы таблицы, сопоставленные с курсом
 * @param {string} today
 */
export function tablePrice(own, today) {
  const next = upcoming(
    own.flatMap((program) => program.groups),
    today,
  ).find((group) => group.price)
  return next?.price ?? own.find((program) => program.price)?.price ?? null
}

/**
 * @typedef {{ id: number, amount: string, currency: string, includesVat?: boolean | null }} CourseOffer
 * @typedef {{ id: number, title: string }} SyncCourse
 * @typedef {{ productId: number, title: string, offerId: number | null, amount: string,
 *   before: string | null }} PriceChange  offerId null — комплектации нет, завести.
 * @typedef {object} SyncPlan
 * @property {PriceChange[]} prices
 * @property {{ program: CourseProgram, key: string }[]} create
 * @property {string[]} skipped  Курсы с несколькими комплектациями: цену решает менеджер.
 */

/**
 * План сверки. programs — с courseId среди ВСЕХ курсов сайта, в том числе скрытых: скрытый курс
 * владелец убрал сам — второй такой же сайт не заводит.
 * @param {{ programs: (CourseProgram & { courseId: number | null })[], courses: SyncCourse[],
 *   offers: Map<number, CourseOffer[]>, today: string }} input
 * @returns {SyncPlan}
 */
export function planCourseSync({ programs, courses, offers, today }) {
  /** @type {SyncPlan} */
  const plan = { prices: [], create: [], skipped: [] }
  for (const course of courses) {
    const own = programs.filter((program) => program.courseId === course.id)
    if (!own.length) continue
    const amount = tablePrice(own, today)
    if (!amount) continue
    const list = offers.get(course.id) ?? []
    if (list.length > 1) {
      plan.skipped.push(course.title)
      continue
    }
    const [offer] = list
    const same = offer && offer.amount === amount && offer.currency === 'KZT' && offer.includesVat
    if (same) continue
    plan.prices.push({
      productId: course.id,
      title: course.title,
      offerId: offer?.id ?? null,
      amount,
      before: offer ? offer.amount : null,
    })
  }
  const keys = new Set()
  for (const program of programs) {
    if (program.courseId != null || !isAlive(program.groups, today)) continue
    const id = lpId(program.link)
    // Без номера l-p.kz курс не связать с таблицей надёжно: такой виден в «Нет на сайте».
    if (!id || keys.has(id)) continue
    keys.add(id)
    plan.create.push({ program, key: lpKey(id) })
  }
  return plan
}

const LATIN = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  ә: 'a',
  ғ: 'g',
  қ: 'k',
  ң: 'n',
  ө: 'o',
  ұ: 'u',
  ү: 'u',
  һ: 'h',
  і: 'i',
}

/** Служебные слова, которые в адрес курса не идут. */
const SLUG_NOISE = /^(онлайн|курс|online|для|по|в|и|с|на)$/

/**
 * Адрес нового курса латиницей: «Онлайн курс «AutoCAD. Основы работы»» → «autocad-osnovy-raboty».
 * Не длиннее 60 знаков, по целым словам.
 * @param {string} title
 */
export function courseSlug(title) {
  const words = title
    .toLowerCase()
    .split(/[^a-zа-яёәғқңөұүһі0-9]+/)
    .filter((word) => word && !SLUG_NOISE.test(word))
    .map((word) =>
      [...word].map((ch) => LATIN[/** @type {keyof typeof LATIN} */ (ch)] ?? ch).join(''),
    )
    .filter(Boolean)
  let slug = ''
  for (const word of words) {
    const next = slug ? `${slug}-${word}` : word
    if (next.length > 60) break
    slug = next
  }
  return slug || 'kurs'
}
