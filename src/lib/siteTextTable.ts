import type { Payload, Where } from 'payload'
import { pages, publications, topics } from '@/cms/collections/content'
import { bimPage } from '@/cms/globals/bimPage'
import { homePage } from '@/cms/globals/homePage'
import { siteSettings } from '@/cms/globals/siteSettings'
import {
  type FieldConfig,
  type PartStore,
  parseSiteKey,
  planSiteUpdates,
  type SiteDoc,
  type SiteUpdate,
  type StoredPart,
  siteGroups,
} from '@/domain/siteTexts.mjs'

/**
 * «Тексты сайта» для страницы «Переводы» (src/domain/siteTexts.mjs): главная, страница BIM,
 * контакты и подвал, темы, текстовые страницы, новости/статьи/акции — со всеми языками сразу
 * (locale: 'all'), и запись переводов. Только опубликованное.
 */

type Doc = Record<string, unknown> & { id: number }

const GLOBALS = [
  { slug: 'home-page', title: 'Главная сайта', fields: homePage.fields },
  { slug: 'bim-page', title: 'Страница BIM', fields: bimPage.fields },
  { slug: 'site-settings', title: 'Контакты и подвал', fields: siteSettings.fields },
] as const

type GlobalSlug = (typeof GLOBALS)[number]['slug']

/**
 * Новости и статьи, перенесённые со старого сайта (ключ импорта legacy:page:…), не переводим —
 * решение владельца 07.11.2026. Переводятся только созданные в новой админке. Условие строится
 * через номера: оператор not_like в этой версии Payload отбор не делает.
 */
export async function newPublicationsWhere(payload: Payload): Promise<Where> {
  const { docs } = await payload.find({
    collection: 'publications',
    depth: 0,
    pagination: false,
    overrideAccess: true,
    select: {},
    where: { legacyKey: { like: 'legacy:' } },
  })
  return docs.length ? { id: { not_in: docs.map((doc) => doc.id) } } : {}
}

const COLLECTIONS: Record<
  'topics' | 'pages' | 'publications',
  { fields: unknown; select: Record<string, true>; sort: string; onlyNew?: boolean }
> = {
  topics: { fields: topics.fields, select: { title: true }, sort: 'id' },
  pages: {
    fields: pages.fields,
    select: { title: true, lead: true, body: true, seo: true },
    sort: 'id',
  },
  publications: {
    fields: publications.fields,
    select: { title: true, kind: true, excerpt: true, body: true, seo: true },
    sort: '-publishedAt',
    onlyNew: true,
  },
}

type SiteCollection = keyof typeof COLLECTIONS

const KIND_LABEL: Record<string, string> = {
  article: 'Статья',
  news: 'Новость',
  promotion: 'Акция',
}

const fieldsOf = (fields: unknown) => fields as FieldConfig[]

function titleOf(collection: SiteCollection, doc: Doc) {
  const title = doc.title as Record<string, string | null> | string | null | undefined
  const ru = (typeof title === 'string' ? title : title?.ru) || `№ ${doc.id}`
  if (collection === 'topics') return `Тема «${ru}»`
  if (collection === 'pages') return `Страница «${ru}»`
  return `${KIND_LABEL[String(doc.kind)] ?? 'Публикация'} «${ru}»`
}

/** Документы набора; only — только эти ключи документов (`pages:3`, `globals:home-page`). */
async function loadSiteDocs(payload: Payload, only?: Set<string>): Promise<SiteDoc[]> {
  const wanted = (key: string) => !only || only.has(key)
  const globals = await Promise.all(
    GLOBALS.filter(({ slug }) => wanted(`globals:${slug}`)).map(async (global) => {
      const doc = await payload.findGlobal({
        slug: global.slug,
        locale: 'all',
        depth: 0,
        overrideAccess: true,
      })
      return {
        key: `globals:${global.slug}`,
        title: global.title,
        fields: fieldsOf(global.fields),
        doc: doc as unknown as Doc,
      }
    }),
  )
  const ids = (collection: SiteCollection) =>
    only
      ? [...only].flatMap((key) => {
          const [name, id] = key.split(':')
          return name === collection ? [Number(id)] : []
        })
      : null
  const lists = await Promise.all(
    (Object.keys(COLLECTIONS) as SiteCollection[]).map(async (collection) => {
      const chosen = ids(collection)
      if (chosen && !chosen.length) return []
      const { fields, select, sort, onlyNew } = COLLECTIONS[collection]
      const where = onlyNew ? await newPublicationsWhere(payload) : null
      const result = await payload.find({
        collection,
        locale: 'all',
        depth: 0,
        pagination: false,
        overrideAccess: true,
        select,
        sort,
        where: {
          and: [
            { status: { equals: 'published' } },
            ...(where ? [where] : []),
            ...(chosen ? [{ id: { in: chosen } }] : []),
          ],
        },
      })
      return (result.docs as unknown as Doc[]).map((doc) => ({
        key: `${collection}:${doc.id}`,
        title: titleOf(collection, doc),
        fields: fieldsOf(fields),
        doc,
      }))
    }),
  )
  return [...globals, ...lists.flat()]
}

/** Сохранённые части длинных текстов (коллекция «Части переводов»). */
async function loadParts(payload: Payload, fieldKeys?: string[]): Promise<PartStore> {
  if (fieldKeys && !fieldKeys.length) return new Map()
  const { docs } = await payload.find({
    collection: 'translation-parts',
    pagination: false,
    depth: 0,
    overrideAccess: true,
    where: fieldKeys ? { key: { in: fieldKeys } } : {},
  })
  const store: PartStore = new Map()
  for (const doc of docs) {
    const part: StoredPart = {
      key: doc.key,
      lang: doc.lang,
      part: doc.part,
      source: doc.source,
      text: doc.text,
    }
    store.set(doc.key, [...(store.get(doc.key) ?? []), part])
  }
  return store
}

export async function siteTableGroups(payload: Payload) {
  const [docs, store] = await Promise.all([loadSiteDocs(payload), loadParts(payload)])
  return siteGroups(docs, store)
}

/** Разбор загруженных или переведённых строк: что и куда запишется, что пропущено. */
export async function planSiteTexts(
  payload: Payload,
  rows: { key: string; kk: string; en: string }[],
) {
  const keys = rows.flatMap((row) => {
    const key = parseSiteKey(row.key)
    return key ? [key] : []
  })
  const docKeys = new Set(keys.map((key) => key.doc))
  const fieldKeys = [
    ...new Set(keys.filter((key) => key.part).map((key) => `${key.doc}:${key.path}`)),
  ]
  const [docs, store] = await Promise.all([
    loadSiteDocs(payload, docKeys),
    loadParts(payload, fieldKeys),
  ])
  const byKey = new Map(docs.map((doc) => [doc.key, doc]))
  return planSiteUpdates(rows, (key) => byKey.get(key), store)
}

const isGlobal = (slug: string): slug is GlobalSlug => GLOBALS.some((item) => item.slug === slug)

/**
 * Запись: по одному сохранению на язык, по очереди (как у товаров: хуки кэша и истории).
 * Потом части длинных текстов: ждущие — сохранить, собранные — удалить.
 */
export async function saveSiteText(payload: Payload, update: SiteUpdate) {
  const [kind, name] = update.doc.split(':')
  for (const lang of ['kk', 'en'] as const) {
    const data = update.data[lang]
    if (!Object.keys(data).length) continue
    if (kind === 'globals' && isGlobal(name))
      await payload.updateGlobal({ slug: name, locale: lang, data, depth: 0, overrideAccess: true })
    else if (kind === 'pages' || kind === 'publications' || kind === 'topics')
      await payload.update({
        collection: kind,
        id: Number(name),
        locale: lang,
        data,
        depth: 0,
        overrideAccess: true,
      })
  }
  for (const part of update.saveParts) {
    const where: Where = {
      and: [
        { key: { equals: part.key } },
        { lang: { equals: part.lang } },
        { part: { equals: part.part } },
      ],
    }
    const found = await payload.find({
      collection: 'translation-parts',
      where,
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const existing = found.docs[0]
    if (existing)
      await payload.update({
        collection: 'translation-parts',
        id: existing.id,
        data: { source: part.source, text: part.text },
        depth: 0,
        overrideAccess: true,
      })
    else
      await payload.create({
        collection: 'translation-parts',
        data: part,
        depth: 0,
        overrideAccess: true,
      })
  }
  for (const { key, lang } of update.removeParts)
    await payload.delete({
      collection: 'translation-parts',
      where: { and: [{ key: { equals: key } }, { lang: { equals: lang } }] },
      overrideAccess: true,
    })
}
