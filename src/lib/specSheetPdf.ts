import path from 'node:path'
import PDFDocument from 'pdfkit'
import type { SpecSheetModel } from '@/domain/specSheet.mjs'

/**
 * Вёрстка PDF «Характеристики оборудования» (src/domain/specSheet.mjs — что в нём). A4, поля
 * 48 pt, шрифт Golos Text в TTF (src/assets/fonts): кириллица, казахские буквы и ₸ в одном файле.
 * Цвета — значения токенов сайта из src/styles/tokens.css: в PDF переменных CSS нет.
 */

const FONTS = path.join(process.cwd(), 'src/assets/fonts')
const REGULAR = path.join(FONTS, 'GolosText-Regular.ttf')
const SEMIBOLD = path.join(FONTS, 'GolosText-SemiBold.ttf')

/** --color-navy, --color-text, --color-text-muted, --color-border. */
const NAVY = '#112174'
const TEXT = '#1a2036'
const MUTED = '#6b7280'
const BORDER = '#e7e9ee'

const MARGIN = 48
/** Место под подвалом страницы: «cad.kz · страница 1 из 2». */
const FOOTER = 28
const PHOTO = { width: 220, height: 170 }
/** Колонка названия характеристики — 42 % ширины, значение — остальное. */
const NAME_SHARE = 0.42
const GAP = 12

type Doc = PDFKit.PDFDocument
type Row = { name: string; value: string }

/** PDF целиком в память: документ — пара страниц, поток не нужен. */
export function renderSpecSheet(model: SpecSheetModel, photo: Buffer | null): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    bufferPages: true,
    font: REGULAR,
    info: {
      Title: `${model.title} — ${model.heading.toLowerCase()}`,
      Author: 'CAD.kz',
      Subject: model.heading,
    },
  })
  doc.registerFont('regular', REGULAR)
  doc.registerFont('semibold', SEMIBOLD)
  const chunks: Buffer[] = []
  doc.on('data', (chunk: Buffer) => chunks.push(chunk))
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })

  header(doc, model)
  product(doc, model, photo)
  specs(doc, model)
  supplier(doc, model)
  pageFooters(doc, model)
  doc.end()
  return done
}

const width = (doc: Doc) => doc.page.width - MARGIN * 2
const bottom = (doc: Doc) => doc.page.height - MARGIN - FOOTER

/** Новая страница, если блок высотой height не помещается. */
function room(doc: Doc, height: number) {
  if (doc.y + height > bottom(doc)) doc.addPage()
}

function rule(doc: Doc) {
  doc
    .moveTo(MARGIN, doc.y)
    .lineTo(MARGIN + width(doc), doc.y)
    .lineWidth(0.75)
    .strokeColor(BORDER)
    .stroke()
}

function header(doc: Doc, model: SpecSheetModel) {
  const top = doc.y
  doc.font('semibold').fontSize(16).fillColor(NAVY).text('CAD.kz', MARGIN, top)
  doc
    .font('regular')
    .fontSize(9)
    .fillColor(MUTED)
    .text(`${model.heading} · ${model.date}`, MARGIN, top + 5, {
      width: width(doc),
      align: 'right',
    })
  doc.y = top + 26
  rule(doc)
  doc.moveDown(1.2)
}

function product(doc: Doc, model: SpecSheetModel, photo: Buffer | null) {
  doc
    .font('semibold')
    .fontSize(20)
    .fillColor(TEXT)
    .text(model.title, MARGIN, doc.y, {
      width: width(doc),
    })
  if (model.vendor) {
    doc.moveDown(0.2)
    doc.font('regular').fontSize(10).fillColor(MUTED).text(model.vendor)
  }
  doc.moveDown(0.8)
  const top = doc.y
  let textLeft = MARGIN
  let photoBottom = top
  if (photo) {
    try {
      doc.image(photo, MARGIN, top, { fit: [PHOTO.width, PHOTO.height], align: 'center' })
      textLeft = MARGIN + PHOTO.width + GAP * 2
      photoBottom = top + PHOTO.height
    } catch {
      // Картинка не читается — документ без фото лучше, чем без документа.
    }
  }
  const textWidth = MARGIN + width(doc) - textLeft
  if (model.summary)
    doc
      .font('regular')
      .fontSize(10.5)
      .fillColor(TEXT)
      .text(model.summary, textLeft, top, { width: textWidth, lineGap: 2 })
  doc
    .font('regular')
    .fontSize(9)
    .fillColor(MUTED)
    .text(`Страница товара: ${model.url}`, textLeft, doc.y + 6, {
      width: textWidth,
      link: model.url,
    })
  doc.y = Math.max(doc.y, photoBottom) + 18
  doc.x = MARGIN
}

function specs(doc: Doc, model: SpecSheetModel) {
  room(doc, 60)
  doc.font('semibold').fontSize(13).fillColor(NAVY).text('Характеристики', MARGIN, doc.y)
  doc.moveDown(0.4)
  for (const group of model.groups) {
    if (group.title) {
      room(doc, 40)
      doc.moveDown(0.5)
      doc
        .font('semibold')
        .fontSize(8.5)
        .fillColor(MUTED)
        .text(group.title.toUpperCase(), MARGIN, doc.y, { characterSpacing: 0.5 })
      doc.moveDown(0.2)
    }
    for (const row of group.rows) tableRow(doc, row, 9.5)
  }
  doc.moveDown(1)
}

/** Строка «название — значение» с линией снизу; длинные значения переносятся. */
function tableRow(doc: Doc, row: Row, size: number) {
  const nameWidth = Math.floor(width(doc) * NAME_SHARE)
  const valueLeft = MARGIN + nameWidth + GAP
  const valueWidth = width(doc) - nameWidth - GAP
  doc.fontSize(size)
  const height =
    Math.max(
      doc.font('regular').heightOfString(row.name, { width: nameWidth }),
      doc.font('regular').heightOfString(row.value, { width: valueWidth }),
    ) + 8
  room(doc, height)
  const top = doc.y + 4
  doc.font('regular').fillColor(MUTED).text(row.name, MARGIN, top, { width: nameWidth })
  doc.font('regular').fillColor(TEXT).text(row.value, valueLeft, top, { width: valueWidth })
  doc.y = top + height - 4
  rule(doc)
}

function supplier(doc: Doc, model: SpecSheetModel) {
  const lines = [...model.contacts, ...model.requisites]
  // Заголовок не остаётся один внизу страницы: с ним хотя бы три строки.
  room(doc, 110)
  doc.font('semibold').fontSize(13).fillColor(NAVY).text('Поставщик — CAD.kz', MARGIN, doc.y)
  doc.moveDown(0.4)
  for (const line of lines) tableRow(doc, { name: line.label, value: line.value }, 9)
  doc.moveDown(0.8)
  doc
    .font('regular')
    .fontSize(8.5)
    .fillColor(MUTED)
    .text(model.note, MARGIN, doc.y, {
      width: width(doc),
    })
}

/** Внизу каждой страницы: сайт и номер страницы. */
function pageFooters(doc: Doc, model: SpecSheetModel) {
  const range = doc.bufferedPageRange()
  for (let index = range.start; index < range.start + range.count; index++) {
    doc.switchToPage(index)
    const y = doc.page.height - MARGIN - 10
    // Подвал ниже нижнего поля: без этого pdfkit сам перенёс бы строку на новую страницу.
    const margin = doc.page.margins.bottom
    doc.page.margins.bottom = 0
    doc
      .font('regular')
      .fontSize(8)
      .fillColor(MUTED)
      .text(`${model.title} · cad.kz · страница ${index + 1} из ${range.count}`, MARGIN, y, {
        width: width(doc),
        align: 'center',
        lineBreak: false,
      })
    doc.page.margins.bottom = margin
  }
}
