import type { NewsCardData } from '@/components/NewsCard/NewsCard'
import { INFO_PAGES, pagePath } from '@/domain/legacyPages.mjs'
import { cms } from './payload'

/** Опубликованная текстовая страница по коду или null. */
export async function getPage(slug: string) {
  const payload = await cms()
  const { docs } = await payload.find({
    collection: 'pages',
    where: { and: [{ status: { equals: 'published' } }, { slug: { equals: slug } }] },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
}

/** Текстовые страницы для боковой колонки: в порядке меню, только опубликованные. */
export async function getInfoLinks(): Promise<NewsCardData[]> {
  const payload = await cms()
  const order = INFO_PAGES.map((page) => page.slug)
  const { docs } = await payload.find({
    collection: 'pages',
    where: { and: [{ status: { equals: 'published' } }, { slug: { in: order } }] },
    limit: order.length,
    depth: 0,
    select: { slug: true, title: true },
  })
  return docs
    .sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug))
    .map((doc) => ({
      id: doc.id,
      href: pagePath(doc.slug),
      title: doc.title,
      date: null,
      topic: null,
      excerpt: null,
      cover: null,
    }))
}
