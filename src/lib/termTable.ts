import type { Payload } from 'payload'
import { keyFacts, softwareFacts } from '@/domain/keyFacts.mjs'
import { plainTitle } from '@/domain/productTitle.mjs'
import { shownSpecs } from '@/domain/specs.mjs'
import {
  type Known,
  planTermUpdates,
  TERM_PREFIX,
  type TermUpdate,
  termCollector,
  termGroups,
} from '@/domain/terms.mjs'
import en from '@/i18n/messages/en.json'
import kk from '@/i18n/messages/kk.json'
import { readResearch } from './equipmentResearch'
import { relId } from './rel'

/**
 * Таблица словаря характеристик и комплектаций для страницы «Переводы» (src/domain/terms.mjs):
 * какие русские тексты сейчас видит покупатель на страницах товаров, что уже переведено, и
 * запись загруженных переводов в коллекцию «Словарь переводов».
 */

const published = { status: { equals: 'published' } } as const

/** Уже переведено в словарях интерфейса (src/i18n/messages) на оба языка — в таблицу не берём. */
const inMessages = (text: string) =>
  Object.hasOwn(kk as Record<string, string>, text) &&
  Object.hasOwn(en as Record<string, string>, text)

/** Тексты со страниц опубликованных товаров: характеристики, факты, комплектации, подбор. */
async function collectTerms(payload: Payload) {
  const [products, offers] = await Promise.all([
    payload.find({
      collection: 'products',
      where: published,
      pagination: false,
      depth: 0,
      overrideAccess: true,
      sort: 'id',
      select: {
        title: true,
        kind: true,
        properties: true,
        researchData: true,
        picker: true,
        pageView: true,
      },
    }),
    payload.find({
      collection: 'offers',
      where: published,
      pagination: false,
      depth: 0,
      overrideAccess: true,
      sort: 'id',
      select: { product: true, configuration: true, license: true },
    }),
  ])
  const offersOf = new Map<number, { configuration: string; license: string }[]>()
  for (const offer of offers.docs) {
    const id = relId(offer.product)
    if (id != null) offersOf.set(id, [...(offersOf.get(id) ?? []), offer])
  }
  const collector = termCollector(inMessages)
  for (const product of products.docs) {
    const where = plainTitle(product.title)
    const own = offersOf.get(product.id) ?? []
    const specs = shownSpecs(product.properties ?? [])
    for (const spec of specs) {
      if (spec.group) collector.add(spec.group, 'group', where)
      collector.add(spec.name, 'name', where)
      collector.add(spec.value, 'value', where, spec.name)
    }
    const facts =
      product.kind === 'software'
        ? softwareFacts(
            specs,
            own.map((offer) => offer.license),
          )
        : keyFacts(readResearch(product.researchData), specs)
    for (const fact of facts) {
      collector.add(fact.name, 'fact', where)
      collector.add(fact.value, 'fact', where, fact.name)
    }
    for (const offer of own) {
      collector.add(offer.configuration, 'configuration', where)
      if (offer.license !== '—') collector.add(offer.license, 'license', where)
    }
    if (product.pageView === 'picker') {
      for (const sw of product.picker?.switches ?? []) {
        collector.add(sw.title, 'switch', where)
        for (const option of sw.options ?? []) {
          collector.add(option.value, 'switchValue', where, sw.title)
          collector.add(option.note, 'note', where)
        }
      }
      for (const step of product.picker?.steps ?? []) {
        collector.add(step.title, 'step', where)
        collector.add(step.hint, 'hint', where)
        for (const item of step.items ?? []) {
          collector.add(item.label, 'option', where)
          collector.add(item.note, 'note', where)
        }
      }
    }
  }
  return collector.list()
}

/** Весь словарь: русский текст → id и переводы. */
async function loadDictionary(payload: Payload) {
  const { docs } = await payload.find({
    collection: 'terms',
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  return new Map<string, Known>(
    docs.map((doc) => [
      doc.ru.trim(),
      { id: doc.id, kk: doc.kk?.trim() ?? '', en: doc.en?.trim() ?? '' },
    ]),
  )
}

/** Строки таблицы словаря (по одной в группе) с текущими переводами. */
export async function termTableGroups(payload: Payload) {
  const [collected, dictionary] = await Promise.all([
    collectTerms(payload),
    loadDictionary(payload),
  ])
  return termGroups(collected, dictionary)
}

/** Разбор загруженных строк словаря: что запишется и что пропущено. */
export async function planTerms(payload: Payload, rows: { key: string; kk: string; en: string }[]) {
  const known = await loadDictionary(payload)
  // Тексты сайта собираются, только если в таблице есть строки, которых ещё нет в словаре:
  // при повторной загрузке и записи частями это лишний проход по всем товарам.
  const fresh = rows.some((row) => !known.has(row.key.slice(TERM_PREFIX.length).trim()))
  if (fresh)
    for (const item of await collectTerms(payload))
      if (!known.has(item.text)) known.set(item.text, { kk: '', en: '' })
  return planTermUpdates(rows, known)
}

/** Запись строки словаря: новая создаётся, существующая дополняется. */
export async function saveTerm(payload: Payload, update: TermUpdate) {
  if (update.id != null) {
    await payload.update({
      collection: 'terms',
      id: update.id,
      data: update.data,
      depth: 0,
      overrideAccess: true,
    })
    return
  }
  await payload.create({
    collection: 'terms',
    data: { ru: update.ru, ...update.data },
    depth: 0,
    overrideAccess: true,
  })
}
