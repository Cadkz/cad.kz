// @ts-check
import { QUICK_ACTIONS } from './assistant.mjs'
import { SEARCH_RETENTION_DAYS, toCsv } from './searchStats.mjs'

/**
 * Архив аналитики на почту администраторам (пожелание владельца 30.10.2026, пункт 7).
 * Раз в ARCHIVE_MONTHS месяца сайт собирает аналитику с прошлой отправки — таблицы страницы
 * «Аналитика», все запросы поиска и разговоры Кадди — в .zip и шлёт письмом всем администраторам.
 * Здесь — расчёт сроков, таблицы архива и текст письма; чтение базы и отправка — src/lib/analyticsArchive.ts.
 */

/** Раз во сколько месяцев отправлять архив. */
export const ARCHIVE_MONTHS = 4

/** Ключ записи в коллекции integrations: когда отправляли и чем кончилось. */
export const ARCHIVE_STATE_KEY = 'analytics-archive'

/**
 * Больше — архив не вкладывается в письмо, а скачивается по ссылке из админки. Почтовые серверы
 * обычно принимают письма до 10–25 МБ, вложение при пересылке растёт примерно на треть.
 */
export const MAX_ATTACHMENT_BYTES = 7 * 1024 * 1024

/** Ячейка Excel вмещает 32 767 знаков — длинную переписку обрезаем с запасом. */
const MAX_CELL = 32_000

const DAY = 86_400_000

/**
 * Дата через n месяцев. Если такого числа в месяце нет (31 октября + 4 месяца), — последний день
 * месяца (28 или 29 февраля).
 * @param {Date} when
 * @param {number} months
 */
export function addMonths(when, months) {
  const result = new Date(when.getTime())
  const day = result.getUTCDate()
  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() + months)
  const last = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate()
  result.setUTCDate(Math.min(day, last))
  return result
}

/**
 * @typedef {object} ArchiveState
 * @property {string} [lastSentAt]  когда архив последний раз ушёл (ISO)
 * @property {string} [lastFrom]  начало периода последнего архива
 * @property {number} [lastRecipients]  скольким администраторам ушло
 * @property {boolean} [lastAttached]  архив был вложением (false — ссылкой)
 * @property {number} [lastBytes]  размер архива
 * @property {string} [lastAttemptAt]  последняя попытка (в том числе неудачная)
 * @property {string} [lastError]  почему последняя попытка не удалась; пусто — удалась
 */

/**
 * Когда следующая отправка по расписанию. Ни разу не отправляли — сразу.
 * @param {ArchiveState} state
 * @returns {Date | null} null — ни разу не отправляли, отправить при первой проверке
 */
export function nextDue(state) {
  return state.lastSentAt ? addMonths(new Date(state.lastSentAt), ARCHIVE_MONTHS) : null
}

/**
 * Пора ли отправлять архив. Неудачная попытка повторяется не чаще раза в сутки (проверка по
 * расписанию и так раз в сутки — это защита от повторов при ручном вызове адреса).
 * @param {ArchiveState} state
 * @param {Date} now
 */
export function isDue(state, now) {
  const due = nextDue(state)
  if (due && now < due) return false
  if (state.lastError && state.lastAttemptAt)
    return now.getTime() - new Date(state.lastAttemptAt).getTime() >= DAY - 3_600_000
  return true
}

/**
 * Период архива: с прошлой отправки до сейчас. Первый раз — за ARCHIVE_MONTHS месяца.
 * Раньше срока хранения запросов поиска данных уже нет — начало не раньше него.
 * @param {ArchiveState} state
 * @param {Date} now
 */
export function archivePeriod(state, now) {
  const oldest = new Date(now.getTime() - SEARCH_RETENTION_DAYS * DAY)
  const wanted = state.lastSentAt ? new Date(state.lastSentAt) : addMonths(now, -ARCHIVE_MONTHS)
  const from = wanted < oldest ? oldest : wanted
  return { from: from.toISOString(), to: now.toISOString() }
}

const dayFormat = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Etc/GMT-5',
})
const stampFormat = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Etc/GMT-5',
})

/** Дата по Казахстану: «30.10.2026». */
export function formatDay(/** @type {string | Date} */ value) {
  return dayFormat.format(new Date(value))
}

/** Дата и время по Казахстану: «30.10.2026 15:45». */
export function formatStamp(/** @type {string | Date} */ value) {
  return stampFormat.format(new Date(value)).replace(',', '')
}

/** Дата для имени файла по Казахстану: «2026-10-30». */
export function fileDay(/** @type {string | Date} */ value) {
  return new Date(new Date(value).getTime() + 5 * 3_600_000).toISOString().slice(0, 10)
}

/** Телефоны и почта в тексте — звёздочками: архив уходит письмом. */
export function maskContacts(/** @type {string} */ text) {
  return text.replace(/\S+@\S+/g, '***').replace(/\+?\d[\d\s()-]{5,}\d/g, '***')
}

const clickName = (/** @type {string | null | undefined} */ click) =>
  click === 'kaddi' ? 'Кадди' : click === 'whatsapp' ? 'WhatsApp' : (click ?? null)

const buttonLabel = (/** @type {string} */ text) =>
  QUICK_ACTIONS.find((action) => action.text === text)?.label ?? text

/**
 * @typedef {ReturnType<typeof import('./searchStats.mjs').summarizeSearches>} SearchSummary
 * @typedef {ReturnType<typeof import('./searchStats.mjs').summarizeConversations>} KaddiSummary
 * @typedef {{ part: string, file: string, title: string, header: string[], rows: (string | number | null)[][] }} AnalyticsTableData
 */

/**
 * Таблицы страницы «Аналитика» целиком (без обрезки страницы): для кнопок «Скачать для Excel»
 * и для архива. part — ключ в адресе выгрузки, file — имя файла латиницей.
 * @param {SearchSummary} searches
 * @param {KaddiSummary} kaddi
 * @returns {AnalyticsTableData[]}
 */
export function analyticsTables(searches, kaddi) {
  const queryRow = (/** @type {import('./searchStats.mjs').QueryStat} */ s) => [
    s.query,
    s.count,
    s.found,
    s.clicks,
    clickName(s.top),
  ]
  const queryHeader = ['Запрос', 'Раз', 'Нашлось', 'Переходов', 'Куда чаще']
  return [
    {
      part: 'searches',
      file: 'zaprosy-poiska',
      title: 'Частые запросы',
      header: queryHeader,
      rows: searches.top.map(queryRow),
    },
    {
      part: 'empty',
      file: 'nichego-ne-nashlos',
      title: 'Ничего не нашлось',
      header: ['Запрос', 'Раз'],
      rows: searches.empty.map((s) => [s.query, s.count]),
    },
    {
      part: 'no-click',
      file: 'nashlos-no-ne-otkryli',
      title: 'Нашлось, но не открыли',
      header: queryHeader,
      rows: searches.noClick.map(queryRow),
    },
    {
      part: 'kaddi-questions',
      file: 'voprosy-kaddi',
      title: 'О чём спрашивают Кадди',
      header: ['Вопрос', 'Раз'],
      rows: kaddi.questions.map((q) => [q.text, q.count]),
    },
    {
      part: 'kaddi-buttons',
      file: 'knopki-kaddi',
      title: 'Кнопки под приветствием',
      header: ['Кнопка', 'Нажали'],
      rows: kaddi.buttons.map((b) => [buttonLabel(b.text), b.count]),
    },
    {
      part: 'kaddi-cards',
      file: 'tovary-kaddi',
      title: 'Какие товары Кадди показывал',
      header: ['Товар', 'Страница', 'Раз'],
      rows: kaddi.cards.map((c) => [c.title, c.href, c.count]),
    },
    {
      part: 'handoffs',
      file: 'peredano-menedzheru',
      title: 'Передал менеджеру',
      header: ['Когда', 'Первый вопрос', 'Заявка', 'Разговор №'],
      rows: kaddi.handedOff.map((h) => [formatStamp(h.at), h.question, h.number, h.id]),
    },
    {
      part: 'unknown',
      file: 'kaddi-ne-znal',
      title: 'Где Кадди не знал ответа',
      header: ['Когда', 'Вопрос', 'Ответ Кадди', 'Разговор №'],
      rows: kaddi.unknown.map((u) => [formatStamp(u.at), u.question, u.reply, u.id]),
    },
  ]
}

/**
 * @typedef {{ createdAt: string, query: string, found: number, source: string, click?: string | null }} RawSearch
 * @typedef {{ role: string, content: string, at?: string, name?: string }} RawMessage
 * @typedef {{ id: number, createdAt: string, state: string, requestNumber?: string | null, messages: RawMessage[] }} RawConversation
 */

const SPEAKER = /** @type {Record<string, string>} */ ({
  user: 'Клиент',
  assistant: 'Кадди',
  manager: 'Менеджер',
})

/** Переписка одним текстом для ячейки Excel: «Клиент: …», «Кадди: …»; контакты скрыты. */
export function dialogText(/** @type {RawMessage[]} */ messages) {
  const text = messages
    .map((m) => {
      const who = SPEAKER[m.role] ?? m.role
      return `${who}: ${maskContacts(m.content.replace(/\s+\n/g, '\n').trim())}`
    })
    .join('\n\n')
  return text.length > MAX_CELL ? `${text.slice(0, MAX_CELL - 1)}…` : text
}

/**
 * @typedef {object} ArchiveInput
 * @property {string} from
 * @property {string} to
 * @property {SearchSummary} searches
 * @property {KaddiSummary} kaddi
 * @property {RawSearch[]} rawSearches  от старых к новым
 * @property {RawConversation[]} conversations  от старых к новым
 * @property {boolean} searchesCut  прочитаны не все запросы (их очень много)
 * @property {boolean} conversationsCut
 */

/** Короткая сводка цифрами — и в архив, и в текст письма (без личных данных). */
export function archiveNumbers(/** @type {ArchiveInput} */ input) {
  const { searches, kaddi } = input
  return [
    ['Поисков', searches.total],
    ['Разных запросов', searches.unique],
    ['Запросов без результатов', searches.empty.length],
    ['Поисков с переходом', searches.clicks],
    ['Разговоров с Кадди', kaddi.total],
    ['Сообщений клиентов Кадди', kaddi.userMessages],
    ['Передано менеджеру', kaddi.handedOff.length],
    ['Ответов «уточнит менеджер»', kaddi.unknown.length],
  ]
}

/**
 * Файлы архива: «что внутри», сводка, таблицы страницы «Аналитика», все запросы поиска и все
 * разговоры Кадди за период. Имена латиницей: старый проводник Windows путает кириллицу в zip.
 * @param {ArchiveInput} input
 * @returns {{ name: string, data: string }[]}
 */
export function archiveFiles(input) {
  const period = `${formatDay(input.from)} – ${formatDay(input.to)}`
  const tables = analyticsTables(input.searches, input.kaddi)
  const number = (/** @type {number} */ n) => String(n).padStart(2, '0')
  const files = [
    {
      name: '01-svodka.csv',
      data: toCsv(['Показатель', 'Значение'], [['Период', period], ...archiveNumbers(input)]),
    },
    ...tables.map((table, index) => ({
      name: `${number(index + 2)}-${table.file}.csv`,
      data: toCsv(table.header, table.rows),
    })),
  ]
  const searchesName = `${number(files.length + 1)}-vse-zaprosy-poiska.csv`
  files.push({
    name: searchesName,
    data: toCsv(
      ['Когда', 'Запрос', 'Нашлось', 'Где искали', 'Куда перешли'],
      input.rawSearches.map((s) => [
        formatStamp(s.createdAt),
        s.query,
        s.found,
        s.source === 'page' ? 'Страница поиска' : 'Подсказки в шапке',
        clickName(s.click),
      ]),
    ),
  })
  const dialogsName = `${number(files.length + 1)}-razgovory-kaddi.csv`
  files.push({
    name: dialogsName,
    data: toCsv(
      ['Начало', 'Разговор №', 'Передан менеджеру', 'Заявка', 'Вопросов клиента', 'Переписка'],
      input.conversations.map((c) => [
        formatStamp(c.createdAt),
        c.id,
        c.state === 'handed-off' || c.requestNumber ? 'да' : 'нет',
        c.requestNumber ?? null,
        c.messages.filter((m) => m.role === 'user').length,
        dialogText(c.messages),
      ]),
    ),
  })

  const cut = [
    input.searchesCut && 'запросов поиска за период очень много — в архиве самые свежие',
    input.conversationsCut && 'разговоров за период очень много — в архиве самые свежие',
  ].filter(Boolean)
  const readme = [
    'Архив аналитики сайта CAD.kz',
    `Период: ${period} (время Казахстана).`,
    '',
    'Файлы .csv открываются в Excel двойным щелчком. Разделитель — точка с запятой.',
    '',
    ...files.map((file, index) => {
      const title =
        index === 0
          ? 'Сводка цифрами'
          : file.name === searchesName
            ? 'Все запросы поиска по одному, с датой: что искали, сколько нашлось, куда перешли'
            : file.name === dialogsName
              ? 'Все разговоры с Кадди целиком. Телефоны и почта скрыты звёздочками'
              : tables[index - 1]?.title
      return `${file.name} — ${title}`
    }),
    '',
    'Запросы поиска сайт хранит 180 дней, потом удаляет. Этот архив — копия на память.',
    'В разговорах с Кадди есть вопросы клиентов: не пересылайте архив за пределы компании.',
    ...(cut.length ? ['', `Внимание: ${cut.join('; ')}.`] : []),
  ]
  return [{ name: '00-chto-vnutri.txt', data: `${readme.join('\r\n')}\r\n` }, ...files]
}

/** Имя файла архива: analitika-cadkz-2026-07-01--2026-10-30.zip. */
export function archiveName(/** @type {string} */ from, /** @type {string} */ to) {
  return `analitika-cadkz-${fileDay(from)}--${fileDay(to)}.zip`
}

/**
 * Письмо администраторам. В тексте — только цифры и ссылки: вопросы клиентов лежат в архиве.
 * @param {object} args
 * @param {ArchiveInput} args.input
 * @param {string} args.siteUrl  адрес сайта без слеша в конце
 * @param {boolean} args.attached  архив во вложении; false — слишком большой, только ссылка
 * @param {number} args.bytes
 * @param {Date | null} args.next  когда следующий архив
 */
export function archiveMail({ input, siteUrl, attached, bytes, next }) {
  const period = `${formatDay(input.from)} – ${formatDay(input.to)}`
  const download = `${siteUrl}/api/admin/analytics/archive?from=${encodeURIComponent(input.from)}&to=${encodeURIComponent(input.to)}`
  const size = `${Math.max(1, Math.round(bytes / 1024))} КБ`
  const lines = [
    'Здравствуйте!',
    '',
    `Архив аналитики сайта CAD.kz за ${period}: что искали на сайте и о чём спрашивали Кадди.`,
    '',
    ...archiveNumbers(input).map(([label, value]) => `${label}: ${value}`),
    '',
    attached
      ? `Архив во вложении (${size}): таблицы для Excel и файл «что внутри».`
      : `Архив большой (${size}) и не помещается в письмо. Скачать — по ссылке, нужно войти в админку как администратор:`,
    ...(attached ? [] : [download]),
    '',
    `Аналитика на сайте: ${siteUrl}/admin/analytics`,
    ...(next ? [`Следующий архив придёт примерно ${formatDay(next)}.`] : []),
    '',
    'В архиве есть вопросы клиентов (телефоны и почта скрыты). Не пересылайте его за пределы компании.',
    'Письмо отправлено сайтом автоматически, всем администраторам админки.',
  ]
  return {
    subject: `CAD.kz: архив аналитики за ${period}`,
    text: lines.join('\n'),
  }
}
