import type { MetadataRoute } from 'next'
import { INDEX_TRANSLATIONS, type Lang, langAlternates, localizeHref } from '@/i18n/locales.mjs'
import { contentLangs, contentLangsMap, listLangs } from '@/lib/contentLangs'
import { familyLines } from '@/lib/families'
import { newsHref } from '@/lib/navigationHrefs'
import { cms } from '@/lib/payload'
import { productPath } from '@/lib/productPath'
import { visibleWhere } from '@/lib/publications'
import { ALL_LANGS, RU_ONLY, siteUrl } from '@/lib/seo'
import { catalogLangs, getTranslations } from '@/lib/translations'

/** Карта сайта строится из базы при каждом запросе: новые товары и новости попадают сразу. */
export const dynamic = 'force-dynamic'

const published = { status: { equals: 'published' } } as const

/**
 * Карта сайта нового cad.kz. Товары — по прежним адресам старого сайта (/catalog/<раздел>/<код>/),
 * чтобы поисковики сохранили их позиции; новости, статьи и акции — по новым адресам.
 * Когда открыты переводы (INDEX_TRANSLATIONS), у страницы есть /kk и /en адреса — только для
 * переведённых страниц (те же правила, что и в метаданных страниц), со связкой hreflang.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const payload = await cms()
  const [products, publications, pages] = await Promise.all([
    payload.find({
      collection: 'products',
      where: { and: [published, { pageView: { not_equals: 'none' } }] },
      limit: 5000,
      depth: 0,
      pagination: false,
      select: { slug: true, legacyUrl: true, updatedAt: true },
    }),
    payload.find({
      collection: 'publications',
      where: visibleWhere(),
      limit: 5000,
      depth: 0,
      pagination: false,
      select: { slug: true, updatedAt: true, kind: true },
    }),
    payload.find({
      collection: 'pages',
      where: published,
      limit: 100,
      depth: 0,
      pagination: false,
      select: { slug: true, updatedAt: true },
    }),
  ])
  const pageSlugs = new Set(pages.docs.map((page) => page.slug))
  const visible = visibleWhere()
  const aboutId = pages.docs.find((page) => page.slug === 'about')?.id
  const [kk, en, catalog, publicationLangs, newsLangs, articleLangs, aboutLangs] =
    await Promise.all([
      getTranslations('kk'),
      getTranslations('en'),
      catalogLangs(),
      contentLangsMap('publications', visible),
      listLangs({ and: [visible, { kind: { equals: 'news' } }] }),
      listLangs({ and: [visible, { kind: { equals: 'article' } }] }),
      aboutId ? contentLangs('pages', aboutId) : RU_ONLY,
    ])
  const ready = { kk: kk?.ready, en: en?.ready }
  const productLangs = (id: number): Lang[] =>
    ALL_LANGS.filter((lang) => lang === 'ru' || ready[lang]?.has(id))
  const absolute = (languages: Record<string, string>) =>
    Object.fromEntries(Object.entries(languages).map(([key, path]) => [key, `${base}${path}`]))
  /** Адрес страницы на каждом языке, на котором она переведена. */
  const entry = (
    path: string,
    lastModified?: string,
    priority = 0.5,
    langs: readonly Lang[] = RU_ONLY,
  ): MetadataRoute.Sitemap => {
    const shown = INDEX_TRANSLATIONS ? langs : RU_ONLY
    const languages = shown.length > 1 ? absolute(langAlternates(path, shown)) : undefined
    return shown.map((lang) => ({
      url: `${base}${localizeHref(lang, path)}`,
      ...(lastModified ? { lastModified } : {}),
      priority,
      ...(languages ? { alternates: { languages } } : {}),
    }))
  }
  return [
    ...entry('/', undefined, 1, ALL_LANGS),
    ...entry('/catalog', undefined, 0.9, catalog),
    ...entry('/bim', undefined, 0.7, ALL_LANGS),
    ...entry('/news', undefined, 0.6, newsLangs),
    ...entry('/articles', undefined, 0.6, articleLangs),
    ...(pageSlugs.has('about') ? entry('/about', undefined, 0.4, aboutLangs) : []),
    ...entry('/contacts', undefined, 0.4, ALL_LANGS),
    ...entry('/renew', undefined, 0.5, ALL_LANGS),
    ...products.docs.flatMap((product) =>
      entry(productPath(product), product.updatedAt, 0.8, productLangs(product.id)),
    ),
    ...[...(await familyLines()).values()].flatMap((family) => entry(family.href, undefined, 0.7)),
    ...publications.docs.flatMap((doc) =>
      entry(
        newsHref(doc.slug),
        doc.updatedAt,
        doc.kind === 'article' ? 0.6 : 0.4,
        publicationLangs(doc.id),
      ),
    ),
  ]
}
