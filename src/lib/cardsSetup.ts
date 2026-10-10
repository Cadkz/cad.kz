import type { Payload } from 'payload'
import type { Product } from '../../payload-types'
import { applyCardEdits, cleanCardText, cleanTitle } from '../domain/textCleanup.mjs'

/** Ключ записи в журнале «Запуски импорта»: настройка выполняется один раз. */
export const CARDS_SETUP_KEY = 'catalog-setup:cards-v1'
const opts = { overrideAccess: true, depth: 0 } as const

type Report = { products: string[]; media: number }

/** Длинный текст карточки: все правила чистки и точечные правки. */
const card = (text: string) => applyCardEdits(cleanCardText(text))
/** Название, строка характеристики, подпись в подборе: без штампов и таблиц. */
const line = (text: string) => applyCardEdits(cleanTitle(text))
const maybe = (text: string | null | undefined, fix: (text: string) => string) =>
  text ? fix(text) : text

/** Изменённые поля товара; пусто — менять нечего. Адрес (slug) не трогаем никогда. */
export function cleanedProduct(product: Product): Partial<Product> {
  const data: Partial<Product> = {}
  const title = line(product.title)
  if (title !== product.title) data.title = title
  const summary = maybe(product.summary, card)
  if (summary !== product.summary) data.summary = summary
  const description = maybe(product.description, card)
  if (description !== product.description) data.description = description
  const properties = (product.properties ?? []).map((row) => ({
    ...row,
    name: line(row.name),
    value: line(row.value),
  }))
  if (
    properties.some(
      (row, i) =>
        row.name !== product.properties?.[i]?.name || row.value !== product.properties?.[i]?.value,
    )
  )
    data.properties = properties
  const faq = (product.faq ?? []).map((row) => ({
    ...row,
    question: line(row.question),
    answer: card(row.answer),
  }))
  if (
    faq.some(
      (row, i) =>
        row.question !== product.faq?.[i]?.question || row.answer !== product.faq?.[i]?.answer,
    )
  )
    data.faq = faq
  const tasks = (product.tasks ?? []).map((row) => ({ ...row, title: line(row.title) }))
  if (tasks.some((row, i) => row.title !== product.tasks?.[i]?.title)) data.tasks = tasks
  if (product.seo) {
    const seo = {
      ...product.seo,
      title: maybe(product.seo.title, line),
      description: maybe(product.seo.description, card),
    }
    if (seo.title !== product.seo.title || seo.description !== product.seo.description)
      data.seo = seo
  }
  if (product.picker?.steps?.length) {
    const steps = product.picker.steps.map((step) => ({
      ...step,
      items: (step.items ?? []).map((item) => ({
        ...item,
        label: maybe(item.label, line),
        note: maybe(item.note, line),
      })),
    }))
    const changed = steps.some((step, i) =>
      step.items.some(
        (item, j) =>
          item.label !== product.picker?.steps?.[i]?.items?.[j]?.label ||
          item.note !== product.picker?.steps?.[i]?.items?.[j]?.note,
      ),
    )
    if (changed) data.picker = { ...product.picker, steps }
  }
  return data
}

/**
 * Чистка карточек по аудиту ChatGPT №2 (src/domain/textCleanup.mjs): буквы-двойники, склейки,
 * штамп интернет-магазина, повторы строк таблиц, системные требования GEO5, Artec Studio 20,
 * Mental Ray у Revit. Подписи картинок «Revit 2024» → «Revit». Один раз; повтор ничего не меняет.
 */
export async function setupCards(payload: Payload): Promise<Report | null> {
  const done = await payload.find({
    collection: 'import-runs',
    where: { idempotencyKey: { equals: CARDS_SETUP_KEY } },
    limit: 1,
    ...opts,
  })
  if (done.docs.length) return null
  const report: Report = { products: [], media: 0 }
  const { docs } = await payload.find({ collection: 'products', pagination: false, ...opts })
  for (const product of docs) {
    const data = cleanedProduct(product)
    if (!Object.keys(data).length) continue
    await payload.update({ collection: 'products', id: product.id, data, ...opts })
    report.products.push(data.title ? `${product.title} → ${data.title}` : product.title)
  }
  const media = await payload.find({
    collection: 'media',
    where: { alt: { like: 'Revit 20' } },
    pagination: false,
    ...opts,
  })
  for (const doc of media.docs) {
    const alt = doc.alt.replace(/^Revit 20\d\d$/, 'Revit')
    if (alt === doc.alt) continue
    await payload.update({ collection: 'media', id: doc.id, data: { alt }, ...opts })
    report.media++
  }
  await payload.create({
    collection: 'import-runs',
    data: { idempotencyKey: CARDS_SETUP_KEY, state: 'done', snapshot: { report } },
    ...opts,
  })
  return report
}
