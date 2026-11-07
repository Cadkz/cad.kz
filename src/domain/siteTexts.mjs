// @ts-check
import { CELL_LIMIT, sameMarkup, TARGETS } from './translationTable.mjs'

/**
 * «Тексты сайта» на странице «Переводы» (07.11.2026): «Главная сайта», «Страница BIM»,
 * «Контакты и подвал», текстовые страницы, новости/статьи/акции и темы публикаций — в той же
 * таблице и том же автопереводе, что товары. Здесь чистая логика без базы.
 *
 * Какие поля переводятся, берётся из настройки полей Payload: переводимое поле — text/textarea
 * с localized (src/cms/fields.ts, translated / translateTexts). Документ приходит с
 * locale: 'all', depth: 0: у переводимого поля значение { ru, kk, en }, массивы и группы общие.
 *
 * Ключ строки: `globals:home-page:faq.<id строки>.question`, `pages:3:body`,
 * `publications:12:seo.title`, `topics:2:title`. Путь — имена полей через точку, у строки
 * массива — её id.
 *
 * Длинный текст (статья до ~70 000 знаков) не влезает ни в ячейку Excel, ни в один ответ модели.
 * Он делится на части по абзацам: `publications:12:body#3`. Переведённые части копятся
 * в служебной коллекции «Части переводов», а когда готовы все — текст собирается и
 * записывается целиком (на сайте до этого русский, без смеси языков). Уже переведённый текст
 * делится на части по строкам: перевод проверяется по разметке (те же строки, что в русском),
 * поэтому n-я непустая строка перевода соответствует n-й русской.
 */

/** @typedef {import('./translationTable.mjs').TableRow} TableRow */
/** @typedef {import('./translationTable.mjs').IncomingRow} IncomingRow */
/** @typedef {import('./translationTable.mjs').TargetLang} TargetLang */
/** @typedef {import('./translationTable.mjs').Problem} Problem */
/** @typedef {Record<string, unknown>} Doc */
/**
 * Поле настройки Payload — только то, что нужно для обхода.
 * @typedef {{
 *   type: string, name?: string, label?: unknown, localized?: boolean,
 *   fields?: FieldConfig[], tabs?: { name?: string, label?: unknown, fields: FieldConfig[] }[],
 *   admin?: { hidden?: boolean },
 * }} FieldConfig
 */

/** Текст длиннее — делится на части. */
export const LONG_TEXT = 4000

/** Размер части: с переводом на два языка укладывается в один ответ модели. */
export const PART_SIZE = 3000

/** Документы набора: глобалы по адресу, коллекции по номеру. */
export const SITE_COLLECTIONS = /** @type {const} */ (['pages', 'publications', 'topics'])

const KEY = /^(globals:[a-z][\w-]*|(?:pages|publications|topics):\d+):([\w.]+?)(?:#(\d+))?$/

/** @param {string} key */
export const isSiteKey = (key) => KEY.test(key)

/** @param {string} key */
export function parseSiteKey(key) {
  const match = KEY.exec(key)
  if (!match) return null
  return { doc: match[1], path: match[2], part: match[3] ? Number(match[3]) : null }
}

/** Пределы длины SEO-полей, как у товаров. */
const LIMITS = /** @type {Record<string, number>} */ ({ 'seo.title': 70, 'seo.description': 200 })

/** @param {unknown} value @param {string} lang */
function pick(value, lang) {
  if (typeof value === 'string') return lang === 'ru' ? value : ''
  if (!value || typeof value !== 'object') return ''
  const text = /** @type {Record<string, unknown>} */ (value)[lang]
  return typeof text === 'string' ? text : ''
}

/** @param {unknown} label @param {string | undefined} name */
const labelOf = (label, name) => (typeof label === 'string' && label ? label : (name ?? ''))

/**
 * @typedef {{ path: string, top: string, what: string, value: unknown }} Entry
 */

/**
 * Переводимые тексты документа по настройке полей: путь, подпись «Что это», значение.
 * @param {FieldConfig[]} fields
 * @param {unknown} data
 * @param {{ path?: string, what?: string }} [at]
 * @returns {Entry[]}
 */
export function textEntries(fields, data, at = {}) {
  const value = data && typeof data === 'object' ? /** @type {Doc} */ (data) : {}
  /** @type {Entry[]} */
  const found = []
  const join = (/** @type {string} */ name) => (at.path ? `${at.path}.${name}` : name)
  const said = (/** @type {string} */ label) => (at.what ? `${at.what} · ${label}` : label)
  for (const field of fields) {
    if (field.admin?.hidden) continue
    if (field.type === 'row' || field.type === 'collapsible') {
      found.push(...textEntries(field.fields ?? [], value, at))
      continue
    }
    if (field.type === 'tabs') {
      for (const tab of field.tabs ?? []) {
        if (tab.name)
          found.push(
            ...textEntries(tab.fields, value[tab.name], {
              path: join(tab.name),
              what: said(labelOf(tab.label, tab.name)),
            }),
          )
        else found.push(...textEntries(tab.fields, value, at))
      }
      continue
    }
    if (!field.name) continue
    const label = labelOf(field.label, field.name)
    if (field.type === 'group') {
      // SEO-поля подписываются как у товаров: по «SEO title» модель и ChatGPT знают предел длины.
      const what = field.name === 'seo' && !at.path ? '' : said(label)
      for (const entry of textEntries(field.fields ?? [], value[field.name], {
        path: join(field.name),
        what,
      }))
        found.push(entry)
      continue
    }
    if (field.type === 'array') {
      const list = value[field.name]
      const rows = /** @type {{ id?: unknown }[]} */ (Array.isArray(list) ? list : [])
      rows.forEach((row, index) => {
        if (!row?.id) return
        found.push(
          ...textEntries(field.fields ?? [], row, {
            path: join(`${field.name}.${row.id}`),
            what: said(`${label} ${index + 1}`),
          }),
        )
      })
      continue
    }
    if ((field.type === 'text' || field.type === 'textarea') && field.localized) {
      const path = join(field.name)
      const what =
        path === 'seo.title' ? 'SEO title' : path === 'seo.description' ? 'SEO description' : label
      found.push({ path, top: path.split('.')[0], what: said(what), value: value[field.name] })
    }
  }
  return found
}

// ---------- длинные тексты: части ----------

/**
 * Части длинного текста по абзацам (пустым строкам), абзац больше части — по строкам. sep —
 * разделитель после части: при сборке перевода он ставится тот же.
 * @param {string} text @param {number} [size]
 * @returns {{ lead: string, parts: { text: string, sep: string }[] }}
 */
export function splitLong(text, size = PART_SIZE) {
  const lead = /^\s*/.exec(text)?.[0] ?? ''
  /** @type {{ text: string, sep: string }[]} */
  const blocks = []
  const tokens = text.slice(lead.length).split(/(\n(?:[ \t]*\n)+)/)
  for (let index = 0; index < tokens.length; index += 2) {
    const block = tokens[index]
    const sep = tokens[index + 1] ?? ''
    if (block.length <= size) {
      blocks.push({ text: block, sep })
      continue
    }
    const lines = block.split(/(\n)/)
    for (let at = 0; at < lines.length; at += 2)
      blocks.push({ text: lines[at], sep: at + 2 < lines.length ? '\n' : sep })
  }
  /** @type {{ text: string, sep: string }[]} */
  const parts = []
  let current = /** @type {{ text: string, sep: string } | null} */ (null)
  for (const block of blocks) {
    if (current && current.text.length + current.sep.length + block.text.length <= size) {
      current.text += current.sep + block.text
      current.sep = block.sep
      continue
    }
    current = { ...block }
    parts.push(current)
  }
  // Хвостовые пробелы и переносы — в разделитель последней части.
  const last = parts.at(-1)
  if (last) {
    const tail = /\s*$/.exec(last.text)?.[0] ?? ''
    if (tail) {
      last.text = last.text.slice(0, last.text.length - tail.length)
      last.sep = tail + last.sep
    }
  }
  return { lead, parts }
}

/** @param {string} text */
const filledLines = (text) => text.split('\n').filter((line) => line.trim()).length

/**
 * Готовый перевод по тем же частям, что русский: по числу непустых строк. Если строк не
 * столько же (перевод правили вручную), null — тогда текст идёт в таблицу целиком.
 * @param {{ text: string }[]} ruParts @param {string} translation
 * @returns {{ text: string, start: number, end: number }[] | null}
 */
export function alignParts(ruParts, translation) {
  /** @type {{ start: number, end: number }[]} */
  const lines = []
  let at = 0
  for (const line of translation.split('\n')) {
    if (line.trim()) lines.push({ start: at, end: at + line.length })
    at += line.length + 1
  }
  const counts = ruParts.map((part) => filledLines(part.text))
  if (counts.reduce((sum, count) => sum + count, 0) !== lines.length) return null
  /** @type {{ text: string, start: number, end: number }[]} */
  const slices = []
  let line = 0
  for (const count of counts) {
    if (!count) return null
    const start = lines[line].start
    const end = lines[line + count - 1].end
    slices.push({ text: translation.slice(start, end), start, end })
    line += count
  }
  return slices
}

/** Отпечаток русского текста части: поменяли русский — старые части перевода не подходят. */
/** @param {string} text */
export function fingerprint(text) {
  let hash = 0x811c9dc5
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return `${text.length}-${hash.toString(16)}`
}

/**
 * Сохранённые части перевода: поле (`publications:12:body`) → язык → номер части → текст.
 * @typedef {{ key: string, lang: TargetLang, part: number, source: string, text: string }} StoredPart
 * @typedef {Map<string, StoredPart[]>} PartStore
 */

/**
 * Части одного текста на одном языке: из готового перевода, иначе из сохранённых частей
 * (с тем же отпечатком русского), иначе пусто.
 * @param {{ text: string }[]} ruParts @param {string} done @param {StoredPart[]} stored
 * @param {TargetLang} lang
 */
function partTexts(ruParts, done, stored, lang) {
  if (done) return alignParts(ruParts, done)?.map((slice) => slice.text) ?? null
  return ruParts.map((part, index) => {
    const found = stored.find((item) => item.lang === lang && item.part === index + 1)
    return found && found.source === fingerprint(part.text) ? found.text : ''
  })
}

// ---------- строки таблицы ----------

/**
 * @typedef {{ key: string, title: string, fields: FieldConfig[], doc: Doc }} SiteDoc
 *   key — `globals:home-page` или `pages:3`, title — как документ подписан в «Что это»
 */

/**
 * Строки таблицы по документам: строки одного документа идут подряд (одной группой) — в части
 * и на дорожке автоперевода не разрываются.
 * @param {SiteDoc[]} docs @param {PartStore} [store]
 * @returns {TableRow[][]}
 */
export function siteGroups(docs, store = new Map()) {
  /** @type {TableRow[][]} */
  const groups = []
  for (const { key, title, fields, doc } of docs) {
    /** @type {TableRow[]} */
    const rows = []
    for (const entry of textEntries(fields, doc)) {
      const ru = pick(entry.value, 'ru').trim()
      if (!ru) continue
      const fieldKey = `${key}:${entry.path}`
      const what = `${title} · ${entry.what}`
      const done = { kk: pick(entry.value, 'kk').trim(), en: pick(entry.value, 'en').trim() }
      if (ru.length > LONG_TEXT) {
        const { parts } = splitLong(ru)
        const stored = store.get(fieldKey) ?? []
        const kk = partTexts(parts, done.kk, stored, 'kk')
        const en = partTexts(parts, done.en, stored, 'en')
        if (parts.length > 1 && kk && en) {
          parts.forEach((part, index) => {
            rows.push({
              key: `${fieldKey}#${index + 1}`,
              what: `${what} · часть ${index + 1} из ${parts.length}`,
              ru: part.text,
              kk: kk[index],
              en: en[index],
            })
          })
          continue
        }
      }
      rows.push({ key: fieldKey, what, ru, kk: done.kk, en: done.en })
    }
    if (rows.length) groups.push(rows)
  }
  return groups
}

// ---------- запись ----------

/**
 * Значение поля верхнего уровня на одном языке для payload.update({ locale }): переводимые
 * тексты — этого языка (нет — null, на сайте будет русский), общие поля (ссылки, флажки,
 * картинки, товары) — как есть. Массивы с id строк: Payload заменяет массив целиком.
 * @param {FieldConfig} field @param {unknown} value @param {TargetLang} lang
 * @returns {unknown}
 */
export function valueForLang(field, value, lang) {
  if ((field.type === 'text' || field.type === 'textarea') && field.localized)
    return pick(value, lang) || null
  if (field.type === 'group') return objectForLang(field.fields ?? [], value, lang)
  if (field.type === 'array') {
    const rows = Array.isArray(value) ? value : []
    return rows.map((row) => ({ id: row?.id, ...objectForLang(field.fields ?? [], row, lang) }))
  }
  return value ?? null
}

/** @param {FieldConfig[]} fields @param {unknown} value @param {TargetLang} lang */
function objectForLang(fields, value, lang) {
  const source = value && typeof value === 'object' ? /** @type {Doc} */ (value) : {}
  /** @type {Doc} */
  const result = {}
  for (const field of fields) {
    if (field.type === 'row' || field.type === 'collapsible')
      Object.assign(result, objectForLang(field.fields ?? [], source, lang))
    else if (field.type === 'tabs') {
      for (const tab of field.tabs ?? []) {
        if (tab.name) result[tab.name] = objectForLang(tab.fields, source[tab.name], lang)
        else Object.assign(result, objectForLang(tab.fields, source, lang))
      }
    } else if (field.name && field.type !== 'ui')
      result[field.name] = valueForLang(field, source[field.name], lang)
  }
  return result
}

/**
 * Поле верхнего уровня по имени, сквозь безымянные строки, вкладки и свёрнутые блоки.
 * @param {FieldConfig[]} fields @param {string} name
 * @returns {FieldConfig | undefined}
 */
export function topField(fields, name) {
  for (const field of fields) {
    if (field.name === name && field.type !== 'tabs') return field
    if ((field.type === 'row' || field.type === 'collapsible') && !field.name) {
      const found = topField(field.fields ?? [], name)
      if (found) return found
    }
    if (field.type === 'tabs')
      for (const tab of field.tabs ?? []) {
        if (tab.name === name) return { type: 'group', name, fields: tab.fields, label: tab.label }
        if (!tab.name) {
          const found = topField(tab.fields, name)
          if (found) return found
        }
      }
  }
  return undefined
}

/**
 * Записать текст по пути в копию поля верхнего уровня: `faq.<id>.question` — в строке массива.
 * @param {Doc} data @param {string} path @param {string} text
 */
export function setAtPath(data, path, text) {
  const parts = path.split('.')
  /** @type {unknown} */
  let node = data
  for (let index = 0; index < parts.length - 1; index++) {
    const part = parts[index]
    if (Array.isArray(node)) node = node.find((row) => String(row?.id) === part)
    else if (node && typeof node === 'object') node = /** @type {Doc} */ (node)[part]
    else return false
  }
  if (!node || typeof node !== 'object' || Array.isArray(node)) return false
  const target = /** @type {Doc} */ (node)
  target[parts[parts.length - 1]] = text
  return true
}

/**
 * @typedef {{
 *   doc: string,
 *   data: Record<TargetLang, Doc>,
 *   texts: number,
 *   saveParts: StoredPart[],
 *   removeParts: { key: string, lang: TargetLang }[],
 * }} SiteUpdate
 *   doc — `globals:home-page` или `pages:3`; data — поля верхнего уровня по языкам;
 *   saveParts — части длинных текстов, которые ещё ждут остальных; removeParts — поля, у
 *   которых части собраны (их сохранённые части удалить)
 */

/**
 * Изменения по документам из загруженных или переведённых строк. Пустая ячейка ничего не
 * стирает, равная текущей — не изменение; разметка должна совпадать с русской.
 * @param {IncomingRow[]} incoming
 * @param {(doc: string) => SiteDoc | undefined} docOf
 * @param {PartStore} [store]
 * @returns {{ updates: SiteUpdate[], problems: Problem[], unchanged: number }}
 */
export function planSiteUpdates(incoming, docOf, store = new Map()) {
  /** @type {Problem[]} */
  const problems = []
  let unchanged = 0
  /** @type {Map<string, { site: SiteDoc, entries: Map<string, Entry>, update: SiteUpdate }>} */
  const docs = new Map()
  /** @type {Map<string, { doc: string, path: string, lang: TargetLang, edits: Map<number, string> }>} */
  const partEdits = new Map()

  const docState = (/** @type {string} */ key) => {
    let state = docs.get(key)
    if (state) return state
    const site = docOf(key)
    if (!site) return null
    state = {
      site,
      entries: new Map(textEntries(site.fields, site.doc).map((entry) => [entry.path, entry])),
      update: { doc: key, data: { kk: {}, en: {} }, texts: 0, saveParts: [], removeParts: [] },
    }
    docs.set(key, state)
    return state
  }

  /** @param {{ site: SiteDoc, update: SiteUpdate }} state @param {Entry} entry @param {TargetLang} lang @param {string} text */
  const write = (state, entry, lang, text) => {
    const data = state.update.data[lang]
    if (!(entry.top in data)) {
      const field = topField(state.site.fields, entry.top)
      data[entry.top] = field ? valueForLang(field, state.site.doc[entry.top], lang) : null
    }
    if (entry.path === entry.top) data[entry.top] = text
    else setAtPath(/** @type {Doc} */ (data), entry.path, text)
  }

  for (const item of incoming) {
    const key = parseSiteKey(item.key)
    if (!key) continue
    const state = docState(key.doc)
    if (!state) {
      problems.push({
        key: item.key,
        lang: 'kk',
        reason: 'страница или новость не найдена (удалена?)',
      })
      continue
    }
    const entry = state.entries.get(key.path)
    const ruWhole = pick(entry?.value, 'ru').trim()
    if (!entry || !ruWhole) {
      problems.push({ key: item.key, lang: 'kk', reason: 'поле не найдено (строку удалили?)' })
      continue
    }
    const parts = key.part ? splitLong(ruWhole).parts : null
    const ruPart = parts?.[(key.part ?? 0) - 1]
    if (parts && (!ruPart || ruWhole.length <= LONG_TEXT)) {
      problems.push({ key: item.key, lang: 'kk', reason: 'русский текст изменился, части другие' })
      continue
    }
    const ru = ruPart ? ruPart.text : ruWhole
    for (const lang of TARGETS) {
      const text = item[lang]
      if (!text) continue
      if (text.length > CELL_LIMIT) {
        problems.push({ key: item.key, lang, reason: 'слишком длинный текст' })
        continue
      }
      if (!sameMarkup(ru, text)) {
        problems.push({
          key: item.key,
          lang,
          reason: 'разметка не совпадает с русской (теги, строки или ссылки)',
        })
        continue
      }
      const limit = LIMITS[key.path]
      if (limit && text.length > limit) {
        problems.push({ key: item.key, lang, reason: `длиннее ${limit} знаков` })
        continue
      }
      if (ruPart) {
        const id = `${key.doc}:${key.path}:${lang}`
        let edit = partEdits.get(id)
        if (!edit) {
          edit = { doc: key.doc, path: key.path, lang, edits: new Map() }
          partEdits.set(id, edit)
        }
        edit.edits.set(key.part ?? 0, text)
        continue
      }
      if (text === pick(entry.value, lang).trim()) {
        unchanged++
        continue
      }
      write(state, entry, lang, text)
      state.update.texts++
    }
  }

  for (const { doc, path, lang, edits } of partEdits.values()) {
    const state = docs.get(doc)
    const entry = state?.entries.get(path)
    if (!state || !entry) continue
    const ruWhole = pick(entry.value, 'ru').trim()
    const { lead, parts } = splitLong(ruWhole)
    const fieldKey = `${doc}:${path}`
    const done = pick(entry.value, lang).trim()
    const aligned = done ? alignParts(parts, done) : null
    if (done && aligned) {
      // Перевод уже есть: меняются только присланные части, остальной текст — как был.
      let text = ''
      let at = 0
      let changed = 0
      aligned.forEach((slice, index) => {
        const next = edits.get(index + 1)
        text += done.slice(at, slice.start) + (next ?? slice.text)
        at = slice.end
        if (next !== undefined && next !== slice.text) changed++
        else if (next !== undefined) unchanged++
      })
      text += done.slice(at)
      if (!changed) continue
      write(state, entry, lang, text)
      state.update.texts += changed
      continue
    }
    if (done) {
      for (const part of edits.keys())
        problems.push({
          key: `${fieldKey}#${part}`,
          lang,
          reason: 'готовый перевод правили вручную — поправьте его в админке целиком',
        })
      continue
    }
    const stored = store.get(fieldKey) ?? []
    /** @type {string[]} */
    const texts = parts.map((part, index) => {
      const edit = edits.get(index + 1)
      if (edit !== undefined) return edit
      const found = stored.find((item) => item.lang === lang && item.part === index + 1)
      return found && found.source === fingerprint(part.text) ? found.text : ''
    })
    if (texts.every(Boolean)) {
      const whole = lead + texts.map((text, index) => text + parts[index].sep).join('')
      if (!sameMarkup(ruWhole, whole.trim())) {
        for (const part of edits.keys())
          problems.push({
            key: `${fieldKey}#${part}`,
            lang,
            reason: 'собранный текст не совпал с русским по разметке',
          })
        continue
      }
      write(state, entry, lang, whole.trim())
      state.update.removeParts.push({ key: fieldKey, lang })
    } else {
      for (const [part, text] of edits)
        state.update.saveParts.push({
          key: fieldKey,
          lang,
          part,
          source: fingerprint(parts[part - 1].text),
          text,
        })
    }
    state.update.texts += edits.size
  }

  const updates = [...docs.values()]
    .map((state) => state.update)
    .filter((update) => update.texts > 0)
  return { updates, problems, unchanged }
}
