// @ts-check
/**
 * Аналитика поиска и Кадди (пожелание владельца 30.10.2026, чат B, пункт 5).
 *
 * Поиск: сайт сохраняет запрос, сколько нашлось и куда кликнули — без адреса, отпечатка и
 * номера сессии: одна строка = одно действие с поиском, связать запросы одного человека нельзя.
 * Цифры и почта внутри запроса (человек вставил телефон) заменяются звёздочками.
 * Кадди: разговоры уже хранятся («Диалоги Кадди»), отсюда берутся частые вопросы, кнопки,
 * передачи менеджеру и ответы «уточнит менеджер» — где Кадди не знал.
 */

/** Сколько дней хранятся запросы поиска. Старше — удаляются при записи новых. */
export const SEARCH_RETENTION_DAYS = 180

/** Сколько разговоров Кадди берётся в отчёт за период (самые свежие) — бережём базу Neon. */
export const CONVERSATIONS_LIMIT = 2000

/** Сколько запросов поиска за период читается в отчёт. */
export const SEARCHES_LIMIT = 20000

/** @typedef {'7' | '30' | '90' | '180'} PeriodKey */

/**
 * Периоды страницы «Аналитика»: ключ в адресе → дней.
 * @type {Readonly<Record<PeriodKey, number>>}
 */
export const PERIODS = { 7: 7, 30: 30, 90: 90, 180: 180 }

/** @param {unknown} value @returns {PeriodKey} */
export function periodKey(value) {
  return typeof value === 'string' && value in PERIODS ? /** @type {PeriodKey} */ (value) : '30'
}

/** Куда ещё, кроме страницы сайта, может уйти человек из поиска. */
const SPECIAL_CLICKS = new Set(['kaddi', 'whatsapp'])

/**
 * Запрос к виду для подсчёта: без лишних пробелов, строчными, «ё» как «е», длинные цифры и почта
 * скрыты. Пустая строка — запрос не сохраняется.
 * @param {unknown} value
 */
export function normalizeQuery(value) {
  if (typeof value !== 'string') return ''
  return value
    .normalize('NFC')
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/[\p{Cc}\p{Cf}]/gu, ' ')
    .replace(/\S+@\S+/g, '***')
    .replace(/\+?\d[\d\s()-]{5,}\d/g, '***')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
}

/**
 * @typedef {'suggest' | 'page'} SearchSource  suggest — подсказки под полем, page — страница /search.
 * @typedef {{ query: string, found: number, source: SearchSource, click: string | null }} SearchEvent
 */

/**
 * Куда перешли: путь на этом сайте (без якоря), «kaddi», «whatsapp» или null; false — мусор.
 * @param {unknown} value
 * @returns {string | null | false}
 */
function parseClick(value) {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') return false
  const text = value.trim()
  if (SPECIAL_CLICKS.has(text)) return text
  const path = text.startsWith('/') && !text.startsWith('//') && text.length <= 300
  return path ? (text.split('#')[0] ?? text) : false
}

/**
 * Проверка события поиска из браузера.
 * @param {unknown} body
 * @returns {{ ok: true, value: SearchEvent } | { ok: false }}
 */
export function validateSearchEvent(body) {
  if (!body || typeof body !== 'object') return { ok: false }
  const raw = /** @type {Record<string, unknown>} */ (body)
  const query = normalizeQuery(raw.query)
  if (query.length < 2) return { ok: false }
  const source = raw.source === 'page' ? 'page' : raw.source === 'suggest' ? 'suggest' : null
  if (!source) return { ok: false }
  const found = Number(raw.found)
  if (!Number.isInteger(found) || found < 0 || found > 1000) return { ok: false }
  const click = parseClick(raw.click)
  if (click === false) return { ok: false }
  return { ok: true, value: { query, found, source, click } }
}

/**
 * @typedef {{ query: string, found: number, source: string, click?: string | null }} SearchRow
 * @typedef {{ query: string, count: number, found: number, clicks: number, top: string | null }} QueryStat
 */

/** @param {Map<string, number>} counts */
function topKey(counts) {
  let best = null
  let max = 0
  for (const [key, count] of counts) {
    if (count > max) {
      best = key
      max = count
    }
  }
  return best
}

/**
 * Сводка запросов поиска: частые, без результатов, доля кликов.
 * found у запроса — последнее известное число (каталог меняется, свежее важнее).
 * @param {SearchRow[]} rows  по времени, от старых к новым
 */
export function summarizeSearches(rows) {
  /** @type {Map<string, { count: number, found: number, clicks: number, targets: Map<string, number> }>} */
  const byQuery = new Map()
  let clicks = 0
  for (const row of rows) {
    const stat = byQuery.get(row.query) ?? { count: 0, found: 0, clicks: 0, targets: new Map() }
    stat.count++
    stat.found = row.found
    if (row.click) {
      clicks++
      stat.clicks++
      stat.targets.set(row.click, (stat.targets.get(row.click) ?? 0) + 1)
    }
    byQuery.set(row.query, stat)
  }
  /** @type {QueryStat[]} */
  const all = [...byQuery].map(([query, stat]) => ({
    query,
    count: stat.count,
    found: stat.found,
    clicks: stat.clicks,
    top: topKey(stat.targets),
  }))
  const byCount = (/** @type {QueryStat} */ a, /** @type {QueryStat} */ b) =>
    b.count - a.count || a.query.localeCompare(b.query, 'ru')
  all.sort(byCount)
  return {
    total: rows.length,
    unique: all.length,
    clicks,
    empty: all.filter((stat) => stat.found === 0),
    /** Нашлось, но никуда не кликнули — человек не увидел нужного. */
    noClick: all.filter((stat) => stat.found > 0 && stat.clicks === 0 && stat.count > 1),
    top: all,
  }
}

/**
 * Фразы, по которым видно, что Кадди не знал ответа и отправил к менеджеру. Цена «по запросу» —
 * не незнание: так задумано, поэтому «стоимость… уточнит менеджер» не считается.
 */
const UNKNOWN = [
  /уточнит (?:специалист|инженер)/i,
  /уточнит менеджер/i,
  /нет (?:точных |таких )?(?:данных|информации|сведений)/i,
  /не могу (?:ответить|подсказать|сказать)/i,
  /не (?:нашлось|найдено) (?:ни|в базе|информации)/i,
  /в (?:базе|описании) (?:этого |такого )?нет/i,
  /не (?:написано|указано) в описании/i,
]

/** Предложение про цену: «стоимость уточнит менеджер» — обычный ответ, а не незнание. */
const PRICE = /стоимост|цен[аыуе]|сумм|по запросу|₸/i

/** Ответ Кадди похож на «не знаю, уточнит менеджер»: ищем по предложениям, кроме фраз о цене. */
export function looksUnknown(/** @type {string} */ text) {
  return text
    .split(/(?<=[.?!])\s+/)
    .some((sentence) => !PRICE.test(sentence) && UNKNOWN.some((re) => re.test(sentence)))
}

/**
 * @typedef {{ role: string, content: string, at?: string, cards?: { title: string, href: string }[] }} ConvMessage
 * @typedef {{ id: number, createdAt: string, state: string, messages: ConvMessage[], requestNumber?: string | null, handoff?: boolean }} ConvRow
 */

/** Вопрос к виду для подсчёта одинаковых: строчными, без знаков в конце. */
function questionKey(/** @type {string} */ text) {
  return normalizeQuery(text.replace(/[?!.…\s]+$/u, ''))
}

/** @param {string} text */
function short(text, max = 160) {
  const line = text
    .replace(/\S+@\S+/g, '***')
    .replace(/\+?\d[\d\s()-]{5,}\d/g, '***')
    .replace(/\s+/g, ' ')
    .trim()
  return line.length > max ? `${line.slice(0, max - 1)}…` : line
}

/**
 * Сводка разговоров Кадди за период.
 * @param {ConvRow[]} rows
 * @param {readonly string[]} quickTexts  тексты кнопок быстрых действий (QUICK_ACTIONS)
 */
export function summarizeConversations(rows, quickTexts) {
  const quick = new Set(quickTexts)
  /** @type {Map<string, { text: string, count: number }>} */
  const questions = new Map()
  /** @type {Map<string, number>} */
  const buttons = new Map()
  /** @type {Map<string, { title: string, href: string, count: number }>} */
  const cards = new Map()
  /** @type {{ id: number, at: string, question: string, number: string | null }[]} */
  const handedOff = []
  /** @type {{ id: number, at: string, question: string, reply: string }[]} */
  const unknown = []
  let userMessages = 0
  const bump = (/** @type {Map<string, number>} */ map, /** @type {string} */ key) =>
    map.set(key, (map.get(key) ?? 0) + 1)

  /** Вопрос клиента: кнопка или свой текст. */
  const onUser = (/** @type {string} */ text) => {
    userMessages++
    if (quick.has(text)) {
      bump(buttons, text)
      return false
    }
    const key = questionKey(text)
    if (key) {
      const stat = questions.get(key) ?? { text: short(text), count: 0 }
      stat.count++
      questions.set(key, stat)
    }
    return true
  }

  const onCards = (/** @type {ConvMessage['cards']} */ list) => {
    for (const card of list ?? []) {
      const stat = cards.get(card.href) ?? { title: card.title, href: card.href, count: 0 }
      stat.count++
      cards.set(card.href, stat)
    }
  }

  for (const row of rows) {
    let lastQuestion = ''
    let firstQuestion = ''
    let unknownHere = false
    for (const message of row.messages) {
      if (message.role === 'user') {
        if (!onUser(message.content)) continue
        lastQuestion = message.content
        firstQuestion ||= message.content
        continue
      }
      if (message.role !== 'assistant') continue
      onCards(message.cards)
      // Один разговор — одна строка в «не знал»: первый такой ответ.
      if (unknownHere || !lastQuestion || !looksUnknown(message.content)) continue
      unknownHere = true
      unknown.push({
        id: row.id,
        at: message.at ?? row.createdAt,
        question: short(lastQuestion),
        reply: short(message.content, 220),
      })
    }
    if (row.state === 'handed-off' || row.requestNumber || row.handoff)
      handedOff.push({
        id: row.id,
        at: row.createdAt,
        question: short(firstQuestion || '—'),
        number: row.requestNumber ?? null,
      })
  }

  const byCount = (/** @type {{ count: number }} */ a, /** @type {{ count: number }} */ b) =>
    b.count - a.count
  return {
    total: rows.length,
    userMessages,
    questions: [...questions.values()].sort(byCount),
    buttons: [...buttons].map(([text, count]) => ({ text, count })).sort(byCount),
    cards: [...cards.values()].sort(byCount),
    handedOff,
    unknown,
  }
}

/**
 * Таблица в CSV для Excel: «;» как разделитель (русский Excel), BOM в начале — иначе кириллица
 * ломается. Значения в кавычках, кавычки внутри удвоены; = + - @ в начале — с апострофом,
 * чтобы Excel не принял текст за формулу.
 * @param {string[]} header
 * @param {(string | number | null)[][]} rows
 */
export function toCsv(header, rows) {
  const cell = (/** @type {string | number | null} */ value) => {
    if (value === null) return ''
    if (typeof value === 'number') return String(value)
    const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
    return `"${safe.replaceAll('"', '""')}"`
  }
  const lines = [header, ...rows].map((row) => row.map(cell).join(';'))
  return `﻿${lines.join('\r\n')}\r\n`
}
