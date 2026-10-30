// @ts-check
// Расписание курсов учебного центра (Google Таблица «Расписание курсов», ведёт администратор УЦ;
// просьба владельца 30.10.2026). Сайт читает таблицу как CSV: ближайшие группы на странице курса,
// в «С этим покупают» у программы, у Кадди; сверка курсов каталога с расписанием в админке.
// Чистые функции без базы и сети.

/**
 * @typedef {'open' | 'started' | 'cancelled'} GroupStatus
 * @typedef {object} CourseGroup  Один запуск курса — строка таблицы.
 * @property {string} title  Название курса как в таблице.
 * @property {string} code  Код запуска: «2611-ACADa».
 * @property {string} start  Дата начала, ГГГГ-ММ-ДД.
 * @property {string} end  Дата завершения, ГГГГ-ММ-ДД или ''.
 * @property {number | null} days  Дней занятий.
 * @property {string} time  «19:00–20:30».
 * @property {string} format  «онлайн».
 * @property {string} teacher
 * @property {string | null} price  Цена по прайсу, тенге.
 * @property {string} link  Программа курса на сайте УЦ.
 * @property {GroupStatus} status
 *
 * @typedef {{ key: string, title: string, titles: string[], link: string, price: string | null,
 *   groups: CourseGroup[] }} CourseProgram  Курс (программа) и все его запуски.
 */

/** Таблица по умолчанию: «Расписание курсов» УЦ. Можно заменить переменной COURSE_SCHEDULE_URL. */
export const SCHEDULE_SHEET_ID = '1W3jiv1hcmmpFjI0akUmN_weWSFKPYtZRNP_2cWDayLo'

/** Номер таблицы из адреса или сам номер; пусто — таблица УЦ по умолчанию. */
function sheetId(/** @type {string | undefined} */ custom) {
  const value = (custom ?? '').trim()
  return /\/spreadsheets\/d\/([\w-]+)/.exec(value)?.[1] ?? (value || SCHEDULE_SHEET_ID)
}

/** Ссылка на саму таблицу — для админки. */
export function scheduleEditUrl(/** @type {string | undefined} */ custom) {
  if (/\/spreadsheets\/d\/e\//.test(custom ?? '') || !/google/.test(custom || 'google'))
    return custom ?? ''
  return `https://docs.google.com/spreadsheets/d/${sheetId(custom)}/edit`
}

/** Адрес CSV-выгрузки первого листа. Таблица должна быть открыта «всем, у кого есть ссылка». */
export function scheduleCsvUrl(/** @type {string | undefined} */ custom) {
  // Готовая ссылка на CSV («Опубликовать в интернете» → CSV, или свой адрес) — как есть.
  const value = (custom ?? '').trim()
  if (
    /^https?:\/\//.test(value) &&
    (/[?&](output|format)=csv/.test(value) || !/\/spreadsheets\/d\//.test(value))
  )
    return value
  return `https://docs.google.com/spreadsheets/d/${sheetId(custom)}/export?format=csv`
}

/**
 * CSV в строки (RFC 4180: кавычки, переносы внутри кавычек, "" внутри поля).
 * @param {string} text
 * @returns {string[][]}
 */
export function parseCsv(text) {
  /** @type {string[][]} */
  const rows = []
  /** @type {string[]} */
  let row = []
  let cell = ''
  let quoted = false
  const source = text.replace(/^﻿/, '')
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        cell += '"'
        i++
      } else if (char === '"') quoted = false
      else cell += char
      continue
    }
    if (char === '"') quoted = true
    else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i++
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += char
  }
  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

const clean = (/** @type {unknown} */ value) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()

/** «29.09.2026», «2026-09-29», «29/09/2026», «2026-09-29 00:00:00» → 2026-09-29; иначе ''. */
export function scheduleDay(/** @type {string} */ raw) {
  const text = clean(raw)
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text)
  if (match) return `${match[1]}-${match[2]?.padStart(2, '0')}-${match[3]?.padStart(2, '0')}`
  match = /^(\d{1,2})[./](\d{1,2})[./](\d{4})/.exec(text)
  if (match) return `${match[3]}-${match[2]?.padStart(2, '0')}-${match[1]?.padStart(2, '0')}`
  return ''
}

/** «229 680», «229680», «229 680,00 ₸» → «229680»; иначе null. */
function money(/** @type {string} */ raw) {
  const text = clean(raw).replace(/[\s ₸тг.]/gi, '')
  const match = /^(\d{1,9})(?:,\d+)?$/.exec(text)
  return match && Number(match[1]) > 0 ? (match[1] ?? null) : null
}

/** Статус строки: «Отменен» — отменён, «Запущен» — уже идёт, остальное — набор открыт. */
function status(/** @type {string} */ raw) {
  const text = clean(raw).toLowerCase()
  if (/отмен/.test(text)) return /** @type {GroupStatus} */ ('cancelled')
  if (/запущ|идет|идёт|завершен|завершён/.test(text)) return /** @type {GroupStatus} */ ('started')
  return /** @type {GroupStatus} */ ('open')
}

/** Подписи колонок таблицы (первая строка, где есть «Наименование курса» и «Дата начала»). */
const HEAD = {
  title: /наименование/i,
  code: /код/i,
  start: /дата начала/i,
  end: /дата заверш/i,
  days: /дни/i,
  time: /время/i,
  format: /место|формат/i,
  teacher: /преподават/i,
  price: /цена/i,
  link: /программ/i,
  status: /статус/i,
}

/**
 * Строки таблицы → запуски курсов. Строки-месяцы («Ноябрь 2026») и пустые пропускаются.
 * @param {string[][]} rows
 * @returns {CourseGroup[] | null} null — это не таблица расписания
 */
export function parseSchedule(rows) {
  const headerRow = rows.findIndex(
    (row) => row.some((c) => HEAD.title.test(c)) && row.some((c) => HEAD.start.test(c)),
  )
  if (headerRow < 0) return null
  const header = rows[headerRow] ?? []
  /** @type {Record<keyof typeof HEAD, number>} */
  const col = /** @type {never} */ ({})
  for (const [key, test] of Object.entries(HEAD)) {
    // «Стоимость за группу» — не цена за человека: берём первую колонку «Цена».
    col[/** @type {keyof typeof HEAD} */ (key)] = header.findIndex((cell) => test.test(cell))
  }
  const cell = (/** @type {string[]} */ row, /** @type {number} */ index) =>
    index < 0 ? '' : clean(row[index])
  /** @type {CourseGroup[]} */
  const groups = []
  for (const row of rows.slice(headerRow + 1)) {
    const title = cell(row, col.title)
    const start = scheduleDay(cell(row, col.start))
    if (!title || !start) continue
    const days = Number(cell(row, col.days))
    groups.push({
      title,
      code: cell(row, col.code),
      start,
      end: scheduleDay(cell(row, col.end)),
      days: Number.isInteger(days) && days > 0 && days < 400 ? days : null,
      time: cell(row, col.time).replace(/\s*[-–—]\s*/, '–'),
      format: cell(row, col.format).toLowerCase(),
      teacher: cell(row, col.teacher),
      price: money(cell(row, col.price)),
      link: /^https?:\/\//.test(cell(row, col.link)) ? cell(row, col.link) : '',
      status: status(cell(row, col.status)),
    })
  }
  return groups
}

/** Ключ программы: номер на сайте УЦ (detail.php?ID=2934), иначе название. */
function programKey(/** @type {CourseGroup} */ group) {
  const id = /[?&]ID=(\d+)/i.exec(group.link)?.[1]
  return id ? `lp-${id}` : `t-${courseWords(group.title).join(' ')}`
}

/**
 * Запуски по курсам (программам): у одного курса один номер на сайте УЦ. Название — самое
 * частое среди запусков, цена — у ближайшего неотменённого запуска.
 * @param {CourseGroup[]} groups
 * @param {string} today ГГГГ-ММ-ДД
 * @returns {CourseProgram[]}
 */
export function programs(groups, today) {
  /** @type {Map<string, CourseGroup[]>} */
  const byKey = new Map()
  for (const group of groups) {
    const key = programKey(group)
    byKey.set(key, [...(byKey.get(key) ?? []), group])
  }
  return [...byKey.entries()].map(([key, list]) => {
    const sorted = [...list].sort((a, b) => a.start.localeCompare(b.start))
    const counts = new Map()
    for (const group of sorted) counts.set(group.title, (counts.get(group.title) ?? 0) + 1)
    const title = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? sorted[0]?.title
    const next = upcoming(sorted, today)[0] ?? sorted.find((g) => g.status !== 'cancelled')
    return {
      key,
      title: title ?? '',
      titles: [...counts.keys()],
      link: sorted.find((g) => g.link)?.link ?? '',
      price: next?.price ?? null,
      groups: sorted,
    }
  })
}

/**
 * Запуски, на которые можно записаться: набор открыт и старт сегодня или позже.
 * @param {CourseGroup[]} groups
 * @param {string} today ГГГГ-ММ-ДД
 */
export function upcoming(groups, today) {
  return groups
    .filter((group) => group.status === 'open' && group.start >= today)
    .sort((a, b) => a.start.localeCompare(b.start))
}

/** Служебные слова названий курсов: в сравнении не участвуют. */
const NOISE = new Set(
  (
    'онлайн курс курсы практикум семинар полный комплексный очный онлайн-курс autodesk в во по ' +
    'на для с со и от до к из системе системы программе пк уровень'
  ).split(' '),
)

/**
 * Слова названия курса для сравнения: нижний регистр, ё → е, без кавычек, служебных слов и
 * годов; русские слова — по первым пяти буквам («архитектора» = «архитектура»).
 * @param {string} title
 */
export function courseWords(title) {
  return title
    .toLowerCase()
    .replaceAll('ё', 'е')
    .split(/[^a-zа-я0-9&+]+/)
    .filter((word) => word && !NOISE.has(word) && !/^(19|20)\d\d$/.test(word))
    .map((word) => (/[а-я]/.test(word) && word.length > 5 ? word.slice(0, 5) : word))
}

/** Уровни курса: «с нуля» и «для продвинутых» — разные курсы, даже если остальное совпало. */
const LEVELS = [/нул|начина|essentials|основы|базов/i, /продвин|углубл|расширен|advanced/i]

const level = (/** @type {string} */ title) => LEVELS.findIndex((test) => test.test(title))

/**
 * Похожесть названий 0…1 (коэффициент Дайса по словам). Разный уровень — 0.
 * @param {string} a
 * @param {string} b
 */
export function titleScore(a, b) {
  const [la, lb] = [level(a), level(b)]
  if (la >= 0 && lb >= 0 && la !== lb) return 0
  const left = new Set(courseWords(a))
  const right = new Set(courseWords(b))
  if (!left.size || !right.size) return 0
  let common = 0
  for (const word of left) if (right.has(word)) common++
  return (2 * common) / (left.size + right.size)
}

/** С какой похожести курс каталога и курс расписания — один и тот же. */
export const MATCH_SCORE = 0.85

/**
 * @typedef {{ id: number, title: string, aliases: string[] }} CatalogCourse
 * @typedef {{ program: CourseProgram, courseId: number | null, score: number }} ProgramMatch
 */

/**
 * Сопоставление: каждому курсу расписания — самый похожий курс каталога (по названию и «Другим
 * названиям»). Совпадение «Другого названия» с названием в таблице — всегда тот курс: так
 * владелец поправляет сопоставление в админке без программиста.
 * @param {CourseProgram[]} list
 * @param {CatalogCourse[]} catalog
 * @returns {ProgramMatch[]}
 */
export function matchPrograms(list, catalog) {
  return list.map((program) => {
    let best = { courseId: /** @type {number | null} */ (null), score: 0 }
    for (const course of catalog) {
      for (const title of program.titles) {
        const exact = course.aliases.some(
          (alias) => courseWords(alias).join(' ') === courseWords(title).join(' '),
        )
        const score = exact ? 1 : titleScore(course.title, title)
        if (score > best.score) best = { courseId: course.id, score }
      }
    }
    return {
      program,
      courseId: best.score >= MATCH_SCORE ? best.courseId : null,
      score: Math.round(best.score * 100) / 100,
    }
  })
}

const MONTHS = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

/** 2026-12-01 → «1 декабря»; другой год, чем today, — «1 декабря 2027». */
export function dayText(/** @type {string} */ day, /** @type {string} */ today = '') {
  const [year, month, date] = day.split('-')
  const name = MONTHS[Number(month) - 1]
  if (!name) return day
  const text = `${Number(date)} ${name}`
  return today && year !== today.slice(0, 4) ? `${text} ${year}` : text
}

/** «1–14 декабря», «27 октября – 11 ноября». */
export function periodText(/** @type {CourseGroup} */ group, /** @type {string} */ today = '') {
  if (!group.end || group.end === group.start) return dayText(group.start, today)
  const [, startMonth] = group.start.split('-')
  const [, endMonth] = group.end.split('-')
  if (startMonth === endMonth && group.start.slice(0, 4) === group.end.slice(0, 4))
    return `${Number(group.start.slice(8))}–${dayText(group.end, today)}`
  return `${dayText(group.start, today)} – ${dayText(group.end, today)}`
}

/** Сегодня по Астане (UTC+5), ГГГГ-ММ-ДД. */
export function astanaToday(/** @type {Date} */ now = new Date()) {
  return new Date(now.getTime() + 5 * 3600_000).toISOString().slice(0, 10)
}

/**
 * Запуск для Кадди и страницы курса: только то, что нужно клиенту (без ответственного и
 * стоимости за группу).
 * @param {CourseGroup} group
 * @param {string} today
 */
export function groupBrief(group, today) {
  return {
    dates: periodText(group, today),
    days: group.days,
    time: group.time,
    format: group.format || 'уточнит менеджер',
    teacher: group.teacher || null,
  }
}

/** Латинские слова названия без производителя и общих слов: программы («autocad», «revit»). */
function programWords(/** @type {string} */ title) {
  const generic = new Set(['autodesk', 'online', 'pro', 'professional', 'lt', 'suite', 'cloud'])
  return (title.toLowerCase().match(/[a-z][a-z0-9-]*/g) ?? []).filter(
    (word) => word.length >= 3 && !generic.has(word),
  )
}

/**
 * Курс к программе для «С этим покупают» и Кадди: в названии курса есть программа из названия
 * товара («AutoCAD. Основы работы» к AutoCAD). Из подходящих — с меньшим числом других программ
 * в названии (к Revit — «Revit для архитектора» раньше «Revit MEP»), затем с ближайшим стартом.
 * Курсы без латинских названий программ («1С:Бухгалтерия») к программам не предлагаются.
 * @template {{ title: string, next: string }} T next — ближайший старт, ГГГГ-ММ-ДД
 * @param {string} productTitle
 * @param {T[]} courses
 * @returns {T | null}
 */
export function pickCourse(productTitle, courses) {
  const own = new Set(programWords(productTitle))
  if (!own.size) return null
  const fitting = courses
    .map((course) => {
      const words = programWords(course.title)
      const hits = words.filter((word) => own.has(word)).length
      return { course, hits, extra: words.length - hits }
    })
    .filter((entry) => entry.hits > 0)
    .sort((a, b) => a.extra - b.extra || a.course.next.localeCompare(b.course.next))
  return fitting[0]?.course ?? null
}

/**
 * @typedef {{ id: number, title: string, href: string }} ReportCourse
 * @typedef {object} ScheduleReport  Сверка курсов сайта с расписанием УЦ.
 * @property {{ course: ReportCourse, programs: CourseProgram[], next: CourseGroup | null,
 *   price: string | null }[]} linked  Есть и на сайте, и в расписании.
 * @property {{ program: CourseProgram, next: CourseGroup | null }[]} missing  В расписании, на
 *   сайте нет (или называется иначе — тогда название из таблицы вписать в «Другие названия»).
 * @property {ReportCourse[]} extra  На сайте, в расписании нет: кандидаты в черновики.
 */

/**
 * @param {(CourseProgram & { courseId: number | null })[]} list
 * @param {ReportCourse[]} courses
 * @param {string} today
 * @returns {ScheduleReport}
 */
export function scheduleReport(list, courses, today) {
  const next = (/** @type {CourseGroup[]} */ groups) => upcoming(groups, today)[0] ?? null
  const linked = courses.flatMap((course) => {
    const own = list.filter((program) => program.courseId === course.id)
    if (!own.length) return []
    const first = next(own.flatMap((program) => program.groups))
    return [{ course, programs: own, next: first, price: first?.price ?? own[0]?.price ?? null }]
  })
  return {
    linked,
    missing: list
      .filter((program) => program.courseId == null)
      .map((program) => ({ program, next: next(program.groups) }))
      .sort((a, b) => (a.next?.start ?? '9').localeCompare(b.next?.start ?? '9')),
    extra: courses.filter((course) => !list.some((program) => program.courseId === course.id)),
  }
}
