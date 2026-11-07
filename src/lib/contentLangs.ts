import type { Where } from 'payload'
import { cache } from 'react'
import { DEFAULT_LANG, LANGS, type Lang } from '@/i18n/locales.mjs'
import { cms } from './payload'
import { newPublicationsWhere } from './siteTextTable'
import { CATALOG_READY_SHARE } from './translations'

/**
 * Языки новостей, статей и текстовых страниц для поисковиков (07.11.2026, как у товаров):
 * русский всегда; казахский и английский — когда на этом языке есть и название, и текст. Пока
 * перевода нет, на /kk и /en показывается русский текст, а страница закрыта от индексации.
 */

type Collection = 'publications' | 'pages'

/** Заполнено на самом языке, без подстановки русского. */
const filled = (field: string): Where => ({
  and: [{ [field]: { exists: true } }, { [field]: { not_equals: '' } }],
})

/** id переведённых на язык документов среди подходящих под where. */
const translatedIds = cache(
  async (collection: Collection, lang: Lang, whereJson: string): Promise<Set<number>> => {
    const payload = await cms()
    const where = JSON.parse(whereJson) as Where
    const { docs } = await payload.find({
      collection,
      locale: lang,
      fallbackLocale: false,
      depth: 0,
      pagination: false,
      select: {},
      where: { and: [where, filled('title'), filled('body')] },
    })
    return new Set(docs.map((doc) => doc.id))
  },
)

/** Языки одного документа. */
export async function contentLangs(collection: Collection, id: number): Promise<Lang[]> {
  const result: Lang[] = [DEFAULT_LANG]
  const where = JSON.stringify({ id: { equals: id } })
  for (const lang of LANGS) {
    if (lang === DEFAULT_LANG) continue
    if ((await translatedIds(collection, lang, where)).has(id)) result.push(lang)
  }
  return result
}

/** Языки всех документов под where одним запросом на язык: для карты сайта. */
export async function contentLangsMap(
  collection: Collection,
  where: Where,
): Promise<(id: number) => Lang[]> {
  const json = JSON.stringify(where)
  const ready = new Map<Lang, Set<number>>()
  for (const lang of LANGS)
    if (lang !== DEFAULT_LANG) ready.set(lang, await translatedIds(collection, lang, json))
  return (id) => LANGS.filter((lang) => lang === DEFAULT_LANG || ready.get(lang)?.has(id))
}

/**
 * Языки списка новостей или статей: открываем, когда из новых материалов (перенесённые со старого
 * сайта не переводятся) переведено столько же, сколько товаров нужно для каталога
 * (CATALOG_READY_SHARE). Новых пока нет — список только по-русски.
 */
export async function listLangs(visible: Where): Promise<Lang[]> {
  const payload = await cms()
  const where: Where = { and: [visible, await newPublicationsWhere(payload)] }
  const { totalDocs } = await payload.count({ collection: 'publications', where })
  const result: Lang[] = [DEFAULT_LANG]
  if (!totalDocs) return result
  const json = JSON.stringify(where)
  for (const lang of LANGS) {
    if (lang === DEFAULT_LANG) continue
    const done = (await translatedIds('publications', lang, json)).size
    if (done / totalDocs >= CATALOG_READY_SHARE) result.push(lang)
  }
  return result
}
