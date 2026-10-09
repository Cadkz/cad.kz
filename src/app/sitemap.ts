import type { MetadataRoute } from 'next'
import { newsHref } from '@/lib/navigationHrefs'
import { cms } from '@/lib/payload'
import { productPath } from '@/lib/productPath'
import { siteUrl } from '@/lib/seo'

/** Карта сайта строится из базы при каждом запросе: новые товары и новости попадают сразу. */
export const dynamic = 'force-dynamic'

const published = { status: { equals: 'published' } } as const

/**
 * Карта сайта нового cad.kz. Товары — по прежним адресам старого сайта (/catalog/<раздел>/<код>/),
 * чтобы поисковики сохранили их позиции; новости, статьи и акции — по новым адресам.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const payload = await cms()
  const [products, publications, pages] = await Promise.all([
    payload.find({
      collection: 'products',
      where: published,
      limit: 5000,
      depth: 0,
      pagination: false,
      select: { slug: true, legacyUrl: true, updatedAt: true },
    }),
    payload.find({
      collection: 'publications',
      where: published,
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
  const entry = (
    path: string,
    lastModified?: string,
    priority = 0.5,
  ): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path}`,
    ...(lastModified ? { lastModified } : {}),
    priority,
  })
  return [
    entry('/', undefined, 1),
    entry('/news', undefined, 0.6),
    entry('/articles', undefined, 0.6),
    ...(pageSlugs.has('about') ? [entry('/about', undefined, 0.4)] : []),
    entry('/contacts', undefined, 0.4),
    ...products.docs.map((product) => entry(productPath(product), product.updatedAt, 0.8)),
    ...publications.docs.map((doc) =>
      entry(newsHref(doc.slug), doc.updatedAt, doc.kind === 'article' ? 0.6 : 0.4),
    ),
  ]
}
