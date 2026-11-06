import { DEFAULT_LANG, type Lang } from '@/i18n/locales.mjs'
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
}

function loadTranslations(lang: Lang) {
  return async (): Promise<Stored> => {
    const payload = await cmsData()
    const query = { locale: lang, fallbackLocale: false, pagination: false, depth: 0 } as const
    const [products, sections] = await Promise.all([
      payload.find({ ...query, collection: 'products', select: { title: true, summary: true } }),
      payload.find({
        ...query,
        collection: 'sections',
        select: { slug: true, title: true, summary: true },
      }),
    ])
    const result: Stored = { products: [], sections: [] }
    for (const doc of products.docs) {
      const texts = overlay(doc)
      if (texts) result.products.push([doc.id, texts])
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
  return { products: new Map(stored.products), sections: new Map(stored.sections) }
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
