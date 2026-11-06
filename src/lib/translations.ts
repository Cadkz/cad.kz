import { DEFAULT_LANG, LANGS, type Lang } from '@/i18n/locales.mjs'
import { cmsData } from './payload'
import { siteCached } from './siteCache'

/**
 * Переводы товаров и разделов (поля по языкам в админке, 06.11.2026).
 *
 * Сайт по-прежнему собирает каталог по-русски: часть логики узнаёт товар по русскому названию
 * (логотипы карточек, правила направлений). Переводы накладываются поверх уже собранных данных,
 * по id товара и адресу раздела, только для показа. Здесь лишь то, что действительно переведено
 * (fallbackLocale: false): нет перевода — остаётся русский текст.
 */
export type TextOverlay = { title?: string; summary?: string }

export type Translations = {
  products: Map<number, TextOverlay>
  sections: Map<string, TextOverlay>
  /** Опубликованные товары, переведённые для поисковиков: есть название и описание на этом языке. */
  ready: Set<number>
  published: number
}

const filled = (value: string | null | undefined) => (value?.trim() ? value : undefined)

const overlay = (doc: { title?: string | null; summary?: string | null }): TextOverlay | null => {
  const title = filled(doc.title)
  const summary = filled(doc.summary)
  return title || summary ? { ...(title && { title }), ...(summary && { summary }) } : null
}

/** Как переводы лежат в кэше: кэш Next.js хранит данные как JSON, Map там превращается в {}. */
type Stored = {
  products: [number, TextOverlay][]
  sections: [string, TextOverlay][]
  ready: number[]
  /** Сколько товаров опубликовано: от этого считается доля переведённых для каталога. */
  published: number
}

function loadTranslations(lang: Lang) {
  return async (): Promise<Stored> => {
    const payload = await cmsData()
    const query = { locale: lang, fallbackLocale: false, pagination: false, depth: 0 } as const
    const [products, sections] = await Promise.all([
      payload.find({
        ...query,
        collection: 'products',
        select: { title: true, summary: true, description: true, status: true },
      }),
      payload.find({
        ...query,
        collection: 'sections',
        select: { slug: true, title: true, summary: true },
      }),
    ])
    const result: Stored = { products: [], sections: [], ready: [], published: 0 }
    for (const doc of products.docs) {
      const texts = overlay(doc)
      if (texts) result.products.push([doc.id, texts])
      if (doc.status !== 'published') continue
      result.published += 1
      // Само описание в кэш не кладём: нужен только признак «страница переведена».
      if (filled(doc.title) && filled(doc.description)) result.ready.push(doc.id)
    }
    for (const doc of sections.docs) {
      const texts = overlay(doc)
      if (texts && doc.slug) result.sections.push([doc.slug, texts])
    }
    return result
  }
}

const cached: Partial<Record<Lang, () => Promise<Stored>>> = {
  kk: siteCached('translations-kk', loadTranslations('kk')),
  en: siteCached('translations-en', loadTranslations('en')),
}

/** Переводы для языка; для русского — null (накладывать нечего). */
export async function getTranslations(lang: Lang): Promise<Translations | null> {
  const load = lang === DEFAULT_LANG ? undefined : cached[lang]
  if (!load) return null
  // До 06.11.2026 в кэш клали Map: со второго запроса /kk/catalog падал (Map из JSON — {}).
  const stored = await load()
  return {
    products: new Map(stored.products),
    sections: new Map(stored.sections),
    ready: new Set(stored.ready ?? []),
    published: stored.published ?? 0,
  }
}

/**
 * Языки, на которых страница товара открыта поисковикам: русский всегда, казахский и английский —
 * когда у товара переведены название и описание. Остальные переведутся позже и откроются сами.
 */
export async function productLangs(id: number): Promise<Lang[]> {
  const result: Lang[] = [DEFAULT_LANG]
  for (const lang of LANGS) {
    if (lang === DEFAULT_LANG) continue
    if ((await getTranslations(lang))?.ready.has(id)) result.push(lang)
  }
  return result
}

/** Доля товаров для «Каталога»: на языке открываем список, когда переведено столько товаров. */
export const CATALOG_READY_SHARE = 0.9

/** Языки, на которых страница каталога открыта поисковикам (список карточек почти весь переведён). */
export async function catalogLangs(): Promise<Lang[]> {
  const result: Lang[] = [DEFAULT_LANG]
  for (const lang of LANGS) {
    if (lang === DEFAULT_LANG) continue
    const tr = await getTranslations(lang)
    if (tr && tr.published > 0 && tr.ready.size / tr.published >= CATALOG_READY_SHARE)
      result.push(lang)
  }
  return result
}

export { requestLang } from '@/i18n/server'

/** Название и описание товара или раздела на языке страницы. */
export function withTexts<T extends { title: string; summary?: string | null }>(
  item: T,
  texts: TextOverlay | undefined,
): T {
  if (!texts) return item
  return { ...item, ...texts }
}
