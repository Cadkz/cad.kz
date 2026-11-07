// @ts-check
import { ANTHROPIC_URL, ANTHROPIC_VERSION, ModelError } from './anthropicChat.mjs'
import { needsTranslation } from './translationTable.mjs'

/**
 * Автоперевод на странице админки «Переводы» (просьба владельца 06.11.2026: перевод частями
 * через ChatGPT занимал часы). Сервер сам берёт непереведённые строки, переводит их моделью
 * Claude по ключу сайта (MODEL_API_KEY, тот же, что у Кадди) и записывает той же проверкой, что
 * и загрузка таблицы. Браузер только повторяет запросы, пока всё не переведено, — несколькими
 * дорожками параллельно (каждая берёт свои товары по номеру, чтобы не переводить одно дважды).
 * Здесь — чистая логика без базы и сети (сеть передаётся снаружи).
 */

/** @typedef {import('./translationTable.mjs').TableRow} TableRow */
/** @typedef {import('./translationTable.mjs').IncomingRow} IncomingRow */

/** Модель перевода: казахский заметно лучше у Sonnet, чем у быстрой модели Кадди. Другую задаёт
 * TRANSLATE_MODEL. */
export const AUTO_MODEL = 'claude-sonnet-5-5'

/** Знаков русского текста за один запрос: перевод на два языка укладывается в пару минут. */
export const AUTO_PART_CHARS = 4000

/** Товаров за один запрос: запись каждого — отдельные сохранения с хуками. */
export const AUTO_PART_DOCS = 4

/** Сколько запросов браузер ведёт одновременно. */
export const AUTO_LANES = 4

/** Предел ответа модели: самое длинное описание товара на двух языках. */
const MAX_TOKENS = 32_000

/** Документ строки: `products:12` из `products:12:tasks:…`; у словаря — сама строка. */
/** @param {string} key */
const docOf = (key) => (key.startsWith('terms:') ? key : key.split(':').slice(0, 2).join(':'))

/**
 * Следующая часть для автоперевода на одной дорожке: группы (документы) с номером
 * index % lanes === lane, только строки без перевода и не из списка пропуска; не больше
 * budget знаков и maxDocs документов. Строка длиннее части идёт одна.
 * @param {TableRow[][]} groups
 * @param {{ lane?: number, lanes?: number, skip?: Set<string>, budget?: number, maxDocs?: number }} [options]
 * @returns {TableRow[]}
 */
export function autoPart(groups, options = {}) {
  const {
    lane = 0,
    lanes = 1,
    skip = new Set(),
    budget = AUTO_PART_CHARS,
    maxDocs = AUTO_PART_DOCS,
  } = options
  /** @type {TableRow[]} */
  const rows = []
  const docs = new Set()
  let chars = 0
  for (const [index, group] of groups.entries()) {
    if (index % lanes !== lane) continue
    for (const item of group) {
      if (!needsTranslation(item) || skip.has(item.key)) continue
      const doc = docOf(item.key)
      if (
        rows.length &&
        (chars + item.ru.length > budget || (!docs.has(doc) && docs.size >= maxDocs))
      )
        return rows
      rows.push(item)
      docs.add(doc)
      chars += item.ru.length
    }
  }
  return rows
}

/** Правила перевода: те же, что в промпте для ChatGPT, но ответ — инструментом, а не файлом. */
export const AUTO_RULES = `Ты профессиональный переводчик сайта CAD.kz — казахстанского дистрибьютора САПР-программ и оборудования (Autodesk, SCAD Office, ЛИРА, GEO5, Artec 3D, Canon, плоттеры, обучение). Переводишь тексты сайта с русского на казахский (kk) и английский (en).

Тебе приходит JSON-массив строк: key — ключ (верни его без изменений), what — что это за текст, ru — русский текст. Переведи каждую строку на оба языка и верни все строки одним вызовом инструмента save_translations. Не пропускай строки и не объединяй их.

Правила:
1. В тексте бывает разметка. HTML-теги (<p>, <h2>, <li>, <strong>, <a href="…"> и т. д.) сохрани точно как в оригинале, переводи только текст между ними. Разметку сайта тоже сохрани: «## » и «### » в начале строки — заголовки, «- » — пункт списка, «1. » — шаг, «> » — выноска, строки «| … |» — таблица (число ячеек то же), [текст](адрес) — ссылка (переводи текст, адрес не трогай), ![подпись](адрес) — картинка. Переносы строк и пустые строки между абзацами оставь на тех же местах. Адреса, имена файлов и числа не меняй.
2. Названия программ, брендов и линеек не переводи: AutoCAD, Revit, Civil 3D, SCAD Office, GEO5, Artec Leo и т. п. Русские названия брендов в английском пиши так, как их пишет производитель: ЛИРА-САПР → LIRA-SAPR, СКАД → SCAD. В казахском тексте бренды оставляй как в оригинале.
3. Казахский — литературный, кириллица, деловой стиль, как на сайтах казахстанских IT-компаний. Термины САПР бери принятые в Казахстане; если устойчивого казахского термина нет, оставь общепринятый (лицензия, BIM, модуль). Тенге: «теңге».
4. Английский — нейтральный деловой (US English), короткие ясные фразы, без маркетинговых преувеличений. Тенге: KZT.
5. Если what содержит «SEO title» — перевод не длиннее 60 знаков, «SEO description» — не длиннее 160 знаков.
6. Строки «Характеристика», «Значение характеристики», «Комплектация», «Подбор: …» и подобные — короткие подписи из карточки товара: переводи так же коротко, как принято в спецификациях. Числа не меняй. Единицы измерения в английском — международные (мм → mm, кг → kg, ч → h, Вт → W), десятичная запятая → точка (0,1 мм → 0.1 mm); в казахском единицы и запятая как в русском. Ответы «Да» / «Нет» — Иә / Жоқ, Yes / No.
7. Если what содержит «часть N из M» — это кусок длинного текста: переведи его как есть, не дописывай начало или конец.
8. Не добавляй ничего от себя, не сокращай смысл, не бери отдельные слова в кавычки для выразительности. Без пояснений — только вызов инструмента.`

const TOOL = {
  name: 'save_translations',
  description: 'Сохранить переводы всех полученных строк.',
  input_schema: {
    type: 'object',
    properties: {
      rows: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: { type: 'string', description: 'Ключ строки без изменений' },
            kk: { type: 'string', description: 'Перевод на казахский' },
            en: { type: 'string', description: 'Перевод на английский' },
          },
          required: ['key', 'kk', 'en'],
        },
      },
    },
    required: ['rows'],
  },
}

/** Тело запроса к модели: правила кешируются у Anthropic (одинаковы во всех запросах). */
/** @param {string} model @param {TableRow[]} rows */
export function autoRequest(model, rows) {
  return {
    model,
    max_tokens: MAX_TOKENS,
    system: [{ type: 'text', text: AUTO_RULES, cache_control: { type: 'ephemeral' } }],
    tools: [TOOL],
    tool_choice: { type: 'tool', name: TOOL.name },
    messages: [
      {
        role: 'user',
        content: JSON.stringify(rows.map(({ key, what, ru }) => ({ key, what, ru }))),
      },
    ],
  }
}

/**
 * Переводы из ответа модели: только по отправленным ключам; язык, где перевод уже был, не
 * трогается (пустая строка — ничего не записывать). missing — ключи, на которые перевода нет.
 * @param {unknown} data ответ Messages API
 * @param {TableRow[]} sent
 * @returns {{ rows: IncomingRow[], missing: string[] }}
 */
export function autoRows(data, sent) {
  const content = /** @type {{ content?: unknown }} */ (data ?? {}).content
  const blocks = Array.isArray(content) ? content : []
  const use = blocks.find((block) => block?.type === 'tool_use' && block.name === TOOL.name)
  const list = Array.isArray(use?.input?.rows) ? use.input.rows : []
  /** @type {Map<string, { kk: string, en: string }>} */
  const got = new Map()
  for (const item of list) {
    if (!item || typeof item.key !== 'string') continue
    const text = (/** @type {unknown} */ value) => (typeof value === 'string' ? value.trim() : '')
    got.set(item.key, { kk: text(item.kk), en: text(item.en) })
  }
  /** @type {IncomingRow[]} */
  const rows = []
  /** @type {string[]} */
  const missing = []
  for (const item of sent) {
    const found = got.get(item.key)
    const kk = item.kk ? '' : (found?.kk ?? '')
    const en = item.en ? '' : (found?.en ?? '')
    if ((!item.kk && !kk) || (!item.en && !en)) missing.push(item.key)
    if (kk || en) rows.push({ key: item.key, kk, en })
  }
  return { rows, missing }
}

/**
 * Перевод части моделью. Ключ уходит только в заголовок запроса.
 * @param {{ fetchImpl: typeof fetch, apiKey: string, model: string, rows: TableRow[], signal?: AbortSignal }} options
 */
export async function translateRows({ fetchImpl, apiKey, model, rows, signal }) {
  const response = await fetchImpl(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify(autoRequest(model, rows)),
    signal,
  })
  if (!response.ok)
    throw new ModelError(`Модель ответила ошибкой ${response.status}`, response.status)
  return autoRows(await response.json(), rows)
}
