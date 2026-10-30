// @ts-check
/**
 * Страница курса на сайте учебного центра l-p.kz (1С-Битрикс, detail.php?ID=…) → описание курса
 * для cad.kz (просьба владельца 30.10.2026, вечер; разметку сверяли по сохранённым владельцем
 * страницам AutoCAD и Revit для архитектора). Описание и программа лежат в блоке
 * `<div class="detail_text">`, длительность — в первой ячейке таблицы расписания `courses_tb`.
 * Программа у разных курсов свёрстана по-разному: заголовками h3, пунктом списка, просто строкой
 * «2. Моделирование…» — всё приводится к одному виду: «## Программа курса», модули «### N. …».
 * Чистые функции без сети.
 */
import { htmlToMarkup } from './bodyHtml.mjs'
import { decodeEntities } from './legacyPages.mjs'

/**
 * Содержимое блока с классом className: от открывающего тега до парного закрывающего </div>.
 * @param {string} html
 * @param {string} className
 */
function divContent(html, className) {
  const open = new RegExp(`<div\\b[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>`, 'i').exec(html)
  if (!open) return null
  const start = open.index + open[0].length
  const tags = /<(\/?)div\b[^>]*>/gi
  tags.lastIndex = start
  let depth = 1
  for (let match = tags.exec(html); match; match = tags.exec(html)) {
    depth += match[1] ? -1 : 1
    if (depth === 0) return html.slice(start, match.index)
  }
  return html.slice(start)
}

const plain = (/** @type {string} */ html) =>
  decodeEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()

/** Строка «2. Моделирование объектов здания» — номер модуля программы. */
const MODULE = /^(\d{1,2})\.\s*(\S.{1,140})$/

/**
 * Разметка описания в один вид: модули программы — «### N. Название», перед первым модулем —
 * «## Программа курса», если раздела ещё нет.
 * @param {string} markup
 */
export function tidyProgram(markup) {
  const blocks = markup
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
  /** @type {string[]} */
  const out = []
  blocks.forEach((block, index) => {
    const module = MODULE.exec(block)
    if (module && !block.includes('\n') && !/[;:]$/.test(block)) {
      out.push(`### ${module[1]}. ${module[2]?.trim()}`)
      return
    }
    // Пункт списка из одного слова-заголовка, за ним сразу список: «1. Введение» у Revit.
    const next = blocks[index + 1] ?? ''
    if (/^- [^\n]{2,80}$/.test(block) && next.startsWith('- ')) {
      const title = block.slice(2).trim()
      const second = blocks.slice(index + 1).find((b) => MODULE.test(b))
      out.push(`### ${second && MODULE.exec(second)?.[1] === '2' ? '1. ' : ''}${title}`)
      return
    }
    out.push(block)
  })
  const firstModule = out.findIndex((block) => block.startsWith('### '))
  if (firstModule >= 0 && !out.slice(0, firstModule).some((block) => block.startsWith('## ')))
    out.splice(firstModule, 0, '## Программа курса')
  return out.join('\n\n')
}

/**
 * Коротко для карточки: первый абзац описания, одной-двумя фразами до 240 знаков. Подпись
 * в начале («Для кого курс: …») убирается.
 * @param {string} markup
 */
export function courseSummary(markup) {
  const first = markup
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !/^(#|- |\d+\.|\||>|!\[)/.test(block))
  if (!first) return ''
  const text = first.replace(/^[А-ЯЁA-Z][^.:!?]{0,30}:\s+/, '').replace(/\s+/g, ' ')
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text]
  let summary = ''
  for (const sentence of sentences) {
    if (summary && (summary + sentence).length > 240) break
    summary += sentence
  }
  summary = summary.trim()
  if (summary.length > 240) summary = `${summary.slice(0, summary.lastIndexOf(' ', 236))}…`
  return summary.charAt(0).toUpperCase() + summary.slice(1)
}

/**
 * @typedef {{ title: string, hours: string | null, description: string, summary: string }} CoursePage
 */

/**
 * Страница курса l-p.kz → название, длительность, описание (разметка поля «Описание»), коротко.
 * null — на странице нет блока описания (другая разметка или страница не курса).
 * @param {string} html
 * @returns {CoursePage | null}
 */
export function parseCoursePage(html) {
  const detail = divContent(html, 'detail_text')
  if (detail == null) return null
  const description = tidyProgram(htmlToMarkup(detail))
  if (!description) return null
  const content = divContent(html, 'column_content') ?? html
  const title = plain(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(content)?.[1] ?? '')
  const table = /<table\b[^>]*courses_tb[\s\S]*?<\/table>/i.exec(content)?.[0] ?? ''
  const hours = /(\d{1,3})\s*ак\.?\s*час/i.exec(plain(table))?.[1]
  return {
    title,
    hours: hours ? `${hours} ак. часов` : null,
    description,
    summary: courseSummary(description),
  }
}
