// @ts-check
import { groupSpecs } from './specs.mjs'

/**
 * PDF «Характеристики оборудования» (пожелание владельца 30.10.2026): для закупок и тендеров —
 * название, фото, характеристики, краткое описание, реквизиты и контакты CAD.kz, дата. Здесь —
 * что попадает в документ, без вёрстки: проверяется тестами (tests/specSheet.test.mjs).
 * Вёрстка PDF — src/lib/specSheet.ts.
 */

/** @typedef {{ group: string | null, name: string, value: string }} Spec */

/**
 * Есть ли у товара PDF: только оборудование и только с характеристиками.
 * @param {{ kind: string, properties: unknown[] }} product
 */
export function hasSpecSheet(product) {
  return product.kind === 'hardware' && product.properties.length > 0
}

/**
 * Адрес PDF. Всегда по новому адресу товара, даже если страница живёт по старому адресу cad.kz.
 * @param {string} slug
 */
export function specSheetHref(slug) {
  return `/products/${encodeURIComponent(slug)}/specs.pdf`
}

/**
 * Имя файла для «Сохранить»: латиница, цифры и дефисы — понятно в любой почте и любом архиве.
 * @param {string} slug
 */
export function specSheetFileName(slug) {
  const clean = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return `cad-kz-${clean || 'oborudovanie'}-harakteristiki.pdf`
}

/**
 * Дата документа по Астане: «30.10.2026».
 * @param {Date} [now]
 */
export function specSheetDate(now = new Date()) {
  const astana = new Date(now.getTime() + 5 * 3_600_000)
  const [year, month, day] = astana.toISOString().slice(0, 10).split('-')
  return `${day}.${month}.${year}`
}

/**
 * Контакты для PDF: все телефоны одной строкой, почта, адрес, часы, сайт.
 * @param {{ phones: { label?: string | null, tel: string }[], email: string | null,
 *   address: string | null, hours: string | null }} contacts
 * @param {string} site — адрес сайта без «https://»
 * @returns {{ label: string, value: string }[]}
 */
export function contactLines(contacts, site) {
  /** @type {{ label: string, value: string }[]} */
  const lines = []
  // В настройках сайта label — номер для людей «+7 (7172) 578-028», tel — для набора.
  const phones = contacts.phones.map((phone) => phone.label || phone.tel).filter(Boolean)
  if (phones.length) lines.push({ label: 'Телефон', value: phones.join(', ') })
  if (contacts.email) lines.push({ label: 'Почта', value: contacts.email })
  if (contacts.address) lines.push({ label: 'Адрес', value: contacts.address })
  if (contacts.hours) lines.push({ label: 'Часы работы', value: contacts.hours })
  lines.push({ label: 'Сайт', value: site })
  return lines
}

/** Реквизиты в PDF: только те, что нужны для закупки, — без дат регистрации и свидетельств. */
const REQUISITE_LABELS = /^(бин|иин|кбе|иик|iban|бик|банк|юридический адрес|местонахождение)/iu

/**
 * Реквизиты со страницы «Реквизиты» (src/domain/requisites.mjs) → строки для PDF. Название
 * компании — из вступления страницы, если оно есть.
 * @param {{ intro: string, fields: { label: string, value: string }[] } | null} parsed
 * @returns {{ label: string, value: string }[]}
 */
export function requisiteLines(parsed) {
  if (!parsed) return []
  // «ТОО «CAD.kz» (КАД.кз), действующее на основании Устава…» → только название.
  const company = (parsed.intro.split(/,?\s+действующ/iu)[0] ?? '').replace(/[,.]+$/u, '').trim()
  return [
    ...(company ? [{ label: 'Компания', value: company }] : []),
    ...parsed.fields.filter((field) => field.value && REQUISITE_LABELS.test(field.label)),
  ]
}

/** Знаки, которых нет в шрифте Golos Text, → близкие, что есть (иначе в PDF пустое место). */
const PDF_GLYPHS = /** @type {[RegExp, string][]} */ ([
  [/″/g, '"'],
  [/′/g, "'"],
  [/✓|✔/g, 'да'],
  [/[⌀∅]/g, 'Ø'],
])

/**
 * Текст для PDF: дюймы «36″» → «36"» и другие знаки, которых нет в шрифте.
 * @param {string} text
 */
export function pdfText(text) {
  let result = text
  for (const [pattern, replacement] of PDF_GLYPHS) result = result.replace(pattern, replacement)
  return result
}

/**
 * Содержимое PDF: шапка, товар, характеристики по группам, поставщик.
 * @param {{ title: string, vendor: string | null, summary: string | null, slug: string,
 *   url: string, properties: Spec[] }} product
 * @param {{ date: string, contacts: { label: string, value: string }[],
 *   requisites: { label: string, value: string }[] }} supplier
 */
export function specSheetModel(product, supplier) {
  return {
    heading: 'Характеристики оборудования',
    date: supplier.date,
    title: pdfText(product.title),
    vendor: product.vendor ? `Производитель: ${pdfText(product.vendor)}` : null,
    summary: pdfText(product.summary?.trim() ?? '') || null,
    groups: groupSpecs(product.properties).map(({ group, items }) => ({
      title: group ? pdfText(group) : null,
      rows: items.map((item) => ({ name: pdfText(item.name), value: pdfText(item.value) })),
    })),
    url: product.url,
    contacts: supplier.contacts,
    requisites: supplier.requisites,
    note:
      'Характеристики по данным производителя. Комплектацию, сроки поставки и цену подтвердит ' +
      'менеджер CAD.kz в коммерческом предложении.',
  }
}

/** @typedef {ReturnType<typeof specSheetModel>} SpecSheetModel */
