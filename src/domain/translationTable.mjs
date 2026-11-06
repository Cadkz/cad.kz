// @ts-check
import { createZip } from './zip.mjs'

/**
 * Таблица переводов товаров и разделов (решение владельца 06.11.2026): выгрузка в Excel, перевод
 * в ChatGPT, загрузка обратно. Здесь — чистая логика без базы: строки таблицы из документов,
 * деление на части, запись .xlsx, разбор загруженной таблицы и сборка изменений по документам.
 *
 * Документы приходят из Payload с `locale: 'all'`: у переводимого поля значение — объект
 * { ru, kk, en }; массивы (задачи, вопросы) общие для языков, текст в строке — по языкам.
 *
 * Ключ строки (столбец A) — где лежит текст: `products:12:title`, `products:12:tasks:<id>:title`,
 * `products:12:seo.title`, `sections:3:summary`. По нему загрузка находит место, даже если
 * таблицу пересортировали.
 */

/** @typedef {'kk' | 'en'} TargetLang */
/** @typedef {Record<string, string | null | undefined> | string | null | undefined} Localized */
/**
 * @typedef {{ key: string, what: string, ru: string, kk: string, en: string }} TableRow
 * @typedef {{ key: string, kk: string, en: string }} IncomingRow
 */

export const TARGETS = /** @type {const} */ (['kk', 'en'])

/** Заголовки столбцов: по «Ключ» загрузка находит лист и строку заголовков. */
export const HEADER = ['Ключ (не менять)', 'Что это', 'Русский', 'Қазақша', 'English']

/** Сколько знаков русского текста в одной части: столько ChatGPT переводит за раз без обрывов. */
export const PART_CHARS = 12_000

/** Большая часть (просьба владельца 06.11.2026): втрое больше, меньше кругов, но ChatGPT чаще
 * обрывает перевод — пропуски видно на проверке загрузки. */
export const BIG_PART_CHARS = 36_000

/** Столько товаров записывается за один запрос записи (минута Vercel). */
export const DOCS_PER_REQUEST = 4

/** Поля товара в порядке страницы. Подписи — для столбца «Что это». */
const PRODUCT_FIELDS = [
  ['title', 'Название'],
  ['summary', 'Коротко для карточки'],
  ['description', 'Описание'],
  ['seo.title', 'SEO title'],
  ['seo.description', 'SEO description'],
]
const SECTION_FIELDS = [
  ['title', 'Название раздела'],
  ['summary', 'Короткое описание раздела'],
]
/** Массивы товара: имя массива, поле строки, подпись. */
const PRODUCT_ARRAYS = [
  ['tasks', 'title', 'Задача'],
  ['faq', 'question', 'Вопрос'],
  ['faq', 'answer', 'Ответ'],
]

/** @param {Localized} value @param {string} lang */
function pick(value, lang) {
  if (typeof value === 'string') return lang === 'ru' ? value : ''
  const text = value?.[lang]
  return typeof text === 'string' ? text : ''
}

/** @param {Record<string, unknown>} doc @param {string} path */
function at(doc, path) {
  /** @type {unknown} */
  let value = doc
  for (const part of path.split('.')) {
    if (!value || typeof value !== 'object') return undefined
    value = /** @type {Record<string, unknown>} */ (value)[part]
  }
  return /** @type {Localized} */ (value)
}

/** @param {string} key @param {string} what @param {Localized} value @returns {TableRow | null} */
function row(key, what, value) {
  const ru = pick(value, 'ru').trim()
  if (!ru) return null
  return { key, what, ru, kk: pick(value, 'kk').trim(), en: pick(value, 'en').trim() }
}

/**
 * Строки таблицы: сначала разделы, затем товары. Пустой русский текст не выгружается — переводить
 * нечего. Строки одного документа идут подряд и в части не разрываются.
 * @param {{ sections: Record<string, unknown>[], products: Record<string, unknown>[] }} docs
 * @returns {TableRow[][]}  группы строк по документам
 */
export function tableGroups({ sections, products }) {
  /** @type {TableRow[][]} */
  const groups = []
  for (const doc of sections) {
    const name = pick(at(doc, 'title'), 'ru') || `Раздел ${doc.id}`
    const rows = SECTION_FIELDS.map(([field, label]) =>
      row(`sections:${doc.id}:${field}`, `Раздел «${name}» · ${label}`, at(doc, field)),
    ).filter((item) => item !== null)
    if (rows.length) groups.push(rows)
  }
  for (const doc of products) {
    const name = pick(at(doc, 'title'), 'ru') || `Товар ${doc.id}`
    /** @type {(TableRow | null)[]} */
    const rows = PRODUCT_FIELDS.slice(0, 3).map(([field, label]) =>
      row(`products:${doc.id}:${field}`, `${name} · ${label}`, at(doc, field)),
    )
    for (const [array, field, label] of PRODUCT_ARRAYS) {
      const items = Array.isArray(doc[array]) ? doc[array] : []
      items.forEach((item, index) => {
        if (!item?.id) return
        rows.push(
          row(
            `products:${doc.id}:${array}:${item.id}:${field}`,
            `${name} · ${label} ${index + 1}`,
            item[field],
          ),
        )
      })
    }
    for (const [field, label] of PRODUCT_FIELDS.slice(3))
      rows.push(row(`products:${doc.id}:${field}`, `${name} · ${label}`, at(doc, field)))
    const kept = rows.filter((item) => item !== null)
    if (kept.length) groups.push(kept)
  }
  return groups
}

/** @param {TableRow} item */
export const needsTranslation = (item) => !item.kk || !item.en

/**
 * Следующая часть для перевода: документы, где чего-то не хватает, подряд, пока русский текст
 * не превысит PART_CHARS. Документ больше части идёт один. В строках документа остаются и уже
 * переведённые тексты — ChatGPT видит их и не трогает.
 * @param {TableRow[][]} groups
 * @param {number} [budget]
 */
export function nextPart(groups, budget = PART_CHARS) {
  /** @type {TableRow[]} */
  const rows = []
  let chars = 0
  for (const group of groups) {
    const missing = group.filter(needsTranslation)
    if (!missing.length) continue
    const size = missing.reduce((sum, item) => sum + item.ru.length, 0)
    if (rows.length && chars + size > budget) break
    rows.push(...missing)
    chars += size
  }
  return rows
}

/**
 * Сводка для страницы админки: сколько текстов и сколько уже переведено на каждый язык.
 * @param {TableRow[][]} groups
 */
export function progress(groups) {
  const rows = groups.flat()
  const missing = rows.filter(needsTranslation)
  return {
    texts: rows.length,
    kk: rows.filter((item) => item.kk).length,
    en: rows.filter((item) => item.en).length,
    missingChars: missing.reduce((sum, item) => sum + item.ru.length, 0),
    missingDocs: groups.filter((group) => group.some(needsTranslation)).length,
  }
}

// ---------- запись .xlsx ----------

/** Символы, которых не может быть в XML (управляющие), убираются; переносы строк остаются. */
// biome-ignore lint/suspicious/noControlCharactersInRegex: именно управляющие символы и ищем
const BAD_XML = /[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g

/** @param {string} text */
function xml(text) {
  return text
    .replace(BAD_XML, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Excel не хранит в ячейке больше 32 767 знаков. */
export const CELL_LIMIT = 32_767

/** @param {number} index */
const column = (index) => String.fromCharCode(65 + index)

/** @param {string[]} cells @param {number} number @param {number} style */
function sheetRow(cells, number, style) {
  const body = cells
    .map((value, index) => {
      const ref = `${column(index)}${number}`
      if (!value) return `<c r="${ref}" s="${style}"/>`
      return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`
    })
    .join('')
  return `<row r="${number}">${body}</row>`
}

/**
 * Книга Excel с одним листом «Переводы» без сторонних библиотек: строки — инлайн-текст,
 * перенос по словам, закреплённая шапка.
 * @param {TableRow[]} rows
 * @returns {Buffer}
 */
export function writeTranslationXlsx(rows) {
  const lines = [sheetRow(HEADER, 1, 1)]
  rows.forEach((item, index) => {
    lines.push(sheetRow([item.key, item.what, item.ru, item.kk, item.en], index + 2, 2))
  })
  const widths = [24, 36, 70, 70, 70]
  const sheet =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
    `<cols>${widths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join('')}</cols>` +
    `<sheetData>${lines.join('')}</sheetData>` +
    '</worksheet>'
  const styles =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
    '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
    '</cellXfs>' +
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>'
  return createZip([
    {
      name: '[Content_Types].xml',
      data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '</Types>',
    },
    {
      name: '_rels/.rels',
      data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>',
    },
    {
      name: 'xl/workbook.xml',
      data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<sheets><sheet name="Переводы" sheetId="1" r:id="rId1"/></sheets></workbook>',
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '</Relationships>',
    },
    { name: 'xl/worksheets/sheet1.xml', data: sheet },
    { name: 'xl/styles.xml', data: styles },
  ])
}

// ---------- разбор загруженной таблицы ----------

const KEY = /^(products|sections):(\d+):([\w.]+(?::[\w-]+:\w+)?)$/

/**
 * Строки переводов из прочитанной книги (src/domain/spreadsheet.mjs): лист, где в первой
 * колонке шапки «Ключ». Колонки ищутся по заголовкам, а не по месту.
 * @param {{ name: string, rows: string[][] }[]} sheets
 * @returns {{ rows: IncomingRow[], skipped: number } | null}
 */
export function readTranslationRows(sheets) {
  for (const sheet of sheets) {
    const headerAt = sheet.rows.findIndex((cells) => /^ключ/i.test(cells[0] ?? ''))
    if (headerAt < 0) continue
    const header = sheet.rows[headerAt].map((cell) => cell.toLowerCase())
    const kkAt = header.findIndex((cell) => /қазақ|казах|kk|kazakh/.test(cell))
    const enAt = header.findIndex((cell) => /english|англ|^en$/.test(cell))
    if (kkAt < 0 && enAt < 0) continue
    /** @type {IncomingRow[]} */
    const rows = []
    let skipped = 0
    for (const cells of sheet.rows.slice(headerAt + 1)) {
      const key = (cells[0] ?? '').trim()
      if (!key) continue
      // terms:<русский текст> — строки словаря характеристик и комплектаций (src/domain/terms.mjs).
      if (!KEY.test(key) && !/^terms:./.test(key)) {
        skipped++
        continue
      }
      rows.push({
        key,
        kk: kkAt < 0 ? '' : (cells[kkAt] ?? '').trim(),
        en: enAt < 0 ? '' : (cells[enAt] ?? '').trim(),
      })
    }
    return { rows, skipped }
  }
  return null
}

/**
 * Устройство текста без слов: теги HTML по порядку, у каждой непустой строки — её вид в разметке
 * сайта (src/domain/bodyHtml.mjs: «## » раздел, «- » пункт, «1. » шаг, «> » выноска, «|» таблица)
 * и адреса ссылок и картинок. Перевод не должен терять или добавлять разметку и менять адреса.
 * @param {string} text
 */
function shape(text) {
  const tags = [...text.matchAll(/<\/?([a-z][a-z0-9]*)\b/gi)].map((m) => m[0].toLowerCase())
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (/^#{2,3}\s/.test(line)) return line.slice(0, line.indexOf(' '))
      if (/^[-*•]\s/.test(line)) return '-'
      if (/^\d{1,2}[.)]\s/.test(line)) return '1.'
      if (line.startsWith('>')) return '>'
      if (line.startsWith('|')) return `|${line.split('|').length}`
      if (/^!\[/.test(line)) return '!'
      return 'p'
    })
  const urls = [...text.matchAll(/\]\(([^)\s]+)\)|href="([^"]*)"|src="([^"]*)"/g)].map(
    (m) => m[1] ?? m[2] ?? m[3],
  )
  return JSON.stringify([tags, lines, urls])
}

/**
 * Разметка перевода совпадает с русской: те же теги, строки того же вида, те же адреса.
 * @param {string} ru @param {string} translation
 */
export function sameMarkup(ru, translation) {
  return shape(ru) === shape(translation)
}

/** Пределы длины SEO-полей, как в подсказке админки. */
const LIMITS = { 'seo.title': 70, 'seo.description': 200 }

/**
 * @typedef {{
 *   collection: 'products' | 'sections',
 *   id: number,
 *   data: Record<TargetLang, Record<string, unknown>>,
 *   texts: number,
 * }} DocUpdate
 * @typedef {{ key: string, lang: TargetLang, reason: string }} Problem
 */

/**
 * Изменения по документам: для каждого языка — данные для payload.update({ locale }).
 * Пустая ячейка ничего не стирает; ячейка, равная текущему переводу, не считается изменением.
 * Массивы (задачи, вопросы) передаются целиком со своими id: Payload заменяет массив, поэтому
 * в строки без перевода в таблице подставляется текущий текст этого языка.
 * @param {IncomingRow[]} incoming
 * @param {(collection: 'products' | 'sections', id: number) => Record<string, unknown> | undefined} docOf
 *   документ с locale: 'all'
 * @returns {{ updates: DocUpdate[], problems: Problem[], unchanged: number }}
 */
export function planUpdates(incoming, docOf) {
  /** @type {Map<string, DocUpdate>} */
  const byDoc = new Map()
  /** @type {Problem[]} */
  const problems = []
  let unchanged = 0
  for (const item of incoming) {
    const match = KEY.exec(item.key)
    if (!match) continue
    const collection = /** @type {'products' | 'sections'} */ (match[1])
    const id = Number(match[2])
    const doc = docOf(collection, id)
    if (!doc) {
      problems.push({ key: item.key, lang: 'kk', reason: 'товар или раздел не найден (удалён?)' })
      continue
    }
    const [field, rowId, rowField] = match[3].split(':')
    const allowed =
      collection === 'sections'
        ? SECTION_FIELDS.some(([name]) => name === field) && !rowId
        : rowId
          ? PRODUCT_ARRAYS.some(([array, name]) => array === field && name === rowField)
          : PRODUCT_FIELDS.some(([name]) => name === field)
    if (!allowed) {
      problems.push({ key: item.key, lang: 'kk', reason: 'неизвестное поле' })
      continue
    }
    /** @type {Record<string, unknown> | undefined} */
    let arrayRow
    if (rowId) {
      const items = Array.isArray(doc[field]) ? doc[field] : []
      arrayRow = items.find((/** @type {{ id?: string }} */ entry) => String(entry?.id) === rowId)
      if (!arrayRow) {
        problems.push({ key: item.key, lang: 'kk', reason: 'строка удалена из товара' })
        continue
      }
    }
    const current = rowId ? /** @type {Localized} */ (arrayRow?.[rowField]) : at(doc, field)
    const ru = pick(current, 'ru')
    for (const lang of TARGETS) {
      const text = item[lang]
      if (!text) continue
      if (text === pick(current, lang).trim()) {
        unchanged++
        continue
      }
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
      const limit = LIMITS[/** @type {keyof typeof LIMITS} */ (field)]
      if (limit && text.length > limit) {
        problems.push({ key: item.key, lang, reason: `длиннее ${limit} знаков` })
        continue
      }
      const docKey = `${collection}:${id}`
      let update = byDoc.get(docKey)
      if (!update) {
        update = { collection, id, data: { kk: {}, en: {} }, texts: 0 }
        byDoc.set(docKey, update)
      }
      update.texts++
      const data = update.data[lang]
      if (rowId) setArrayText(data, doc, lang, field, rowId, rowField, text)
      else if (field.startsWith('seo.')) {
        const seo = /** @type {Record<string, unknown>} */ (data.seo ?? currentSeo(doc, lang))
        seo[field.slice(4)] = text
        data.seo = seo
      } else data[field] = text
    }
  }
  return { updates: [...byDoc.values()], problems, unchanged }
}

/** SEO на языке перевода как есть: группа сохраняется целиком. */
/** @param {Record<string, unknown>} doc @param {TargetLang} lang */
function currentSeo(doc, lang) {
  return {
    title: pick(at(doc, 'seo.title'), lang) || null,
    description: pick(at(doc, 'seo.description'), lang) || null,
  }
}

/**
 * Текст в строке массива: массив копируется из документа целиком (id и текущие тексты этого
 * языка), меняется одна ячейка.
 * @param {Record<string, unknown>} data @param {Record<string, unknown>} doc
 * @param {TargetLang} lang @param {string} array @param {string} rowId @param {string} rowField
 * @param {string} text
 */
function setArrayText(data, doc, lang, array, rowId, rowField, text) {
  if (!Array.isArray(data[array])) {
    const fields = PRODUCT_ARRAYS.filter(([name]) => name === array).map(([, name]) => name)
    const items = Array.isArray(doc[array]) ? doc[array] : []
    data[array] = items.map((/** @type {Record<string, unknown>} */ entry) => {
      /** @type {Record<string, unknown>} */
      const copy = { id: entry.id }
      for (const name of fields)
        copy[name] = pick(/** @type {Localized} */ (entry[name]), lang) || null
      return copy
    })
  }
  const target = /** @type {Record<string, unknown>[]} */ (data[array]).find(
    (entry) => String(entry.id) === rowId,
  )
  if (target) target[rowField] = text
}

/**
 * Промпт для ChatGPT (режим Thinking): показывается на странице «Переводы» с кнопкой «Скопировать».
 * Правила совпадают с проверкой загрузки: разметка HTML как в русском, пределы SEO.
 */
export const TRANSLATION_PROMPT = `Ты профессиональный переводчик сайта CAD.kz — казахстанского дистрибьютора САПР-программ и оборудования (Autodesk, SCAD Office, ЛИРА, GEO5, Artec 3D, Canon, плоттеры, обучение). Переведи прикреплённую таблицу Excel с русского на казахский и английский.

Что сделать:
1. Заполни столбец D (Қазақша) и столбец E (English) для каждой строки, где они пустые. Уже заполненные ячейки не меняй.
2. Столбцы A, B, C, порядок строк, название листа не меняй. Строки не удаляй и не объединяй.
3. В тексте бывает разметка. HTML-теги (<p>, <h2>, <li>, <strong>, <a href="…"> и т. д.) сохрани точно как в оригинале, переводи только текст между ними. Разметку сайта тоже сохрани: «## » и «### » в начале строки — заголовки, «- » — пункт списка, «1. » — шаг, «> » — выноска, строки «| … |» — таблица (число ячеек то же), [текст](адрес) — ссылка (переводи текст, адрес не трогай), ![подпись](адрес) — картинка. Переносы строк и пустые строки между абзацами оставь на тех же местах. Адреса, имена файлов и числа не меняй.
4. Названия программ, брендов и линеек не переводи: AutoCAD, Revit, Civil 3D, SCAD Office, GEO5, Artec Leo и т. п. Русские названия брендов в английском пиши так, как их пишет производитель: ЛИРА-САПР → LIRA-SAPR, СКАД → SCAD. В казахском тексте бренды оставляй как в оригинале.
5. Казахский — литературный, кириллица, деловой стиль, как на сайтах казахстанских IT-компаний. Термины САПР бери принятые в Казахстане; если устойчивого казахского термина нет, оставь общепринятый (лицензия, BIM, модуль). Тенге: «теңге».
6. Английский — нейтральный деловой (US English), короткие ясные фразы, без маркетинговых преувеличений. Тенге: KZT.
7. Строки с пометкой «SEO title» в столбце B — не длиннее 60 знаков, «SEO description» — не длиннее 160 знаков.
8. Строки «Характеристика», «Значение характеристики», «Комплектация», «Подбор: …» и подобные — короткие подписи из карточки товара: переводи так же коротко, как принято в спецификациях. Числа не меняй. Единицы измерения в английском — международные (мм → mm, кг → kg, ч → h, Вт → W), десятичная запятая → точка (0,1 мм → 0.1 mm); в казахском единицы и запятая как в русском. Ответы «Да» / «Нет» — Иә / Жоқ, Yes / No.
9. Не добавляй ничего от себя, не сокращай смысл, не бери отдельные слова в кавычки для выразительности.

В конце верни файл .xlsx с тем же устройством, имя: исходное имя + _перевод. Перед отправкой проверь сам: число строк совпадает с исходным, в D и E нет пустых ячеек там, где C заполнен, в каждой ячейке перевода те же теги, те же строки разметки и те же адреса ссылок, что в русском тексте. Напиши, сколько строк переведено.`
