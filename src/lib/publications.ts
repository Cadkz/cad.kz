import type { Where } from 'payload'
import type { NewsCardData } from '@/components/NewsCard/NewsCard'
import type { Media, Publication, Topic } from '../../payload-types'
import { formatDate } from './format'
import { newsHref } from './navigationHrefs'
import { cms } from './payload'

export type PublicationKind = Publication['kind']

function cover(value: Publication['cover']): NewsCardData['cover'] {
  if (!value || typeof value === 'number') return null
  const media = value as Media
  if (!media.url || !media.width || !media.height) return null
  return { url: media.url, alt: media.alt, width: media.width, height: media.height }
}

/** Тема публикации из связи (при depth ≥ 1), прежнее текстовое поле — запасной вариант. */
export function themeOf(publication: Publication): { slug: string | null; title: string } | null {
  const theme = publication.theme
  if (theme && typeof theme === 'object') return { slug: (theme as Topic).slug, title: theme.title }
  return publication.topic ? { slug: null, title: publication.topic } : null
}

export function toCard(publication: Publication): NewsCardData {
  return {
    id: publication.id,
    href: newsHref(publication.slug),
    title: publication.title,
    date: publication.publishedAt ? formatDate(publication.publishedAt) : null,
    topic: themeOf(publication)?.title ?? null,
    excerpt: publication.excerpt ?? null,
    cover: cover(publication.cover),
  }
}

/** Опубликованные материалы, новые сверху. */
export async function getPublications({
  kinds = ['news'],
  limit = 12,
  page = 1,
  topic,
}: {
  kinds?: PublicationKind[]
  limit?: number
  page?: number
  /** Адрес темы (slug из «Тем новостей и статей»). */
  topic?: string | null
} = {}) {
  const payload = await cms()
  const result = await payload.find({
    collection: 'publications',
    where: {
      and: [
        { status: { equals: 'published' } },
        { kind: { in: kinds } },
        ...(topic ? [{ 'theme.slug': { equals: topic } }] : []),
      ],
    },
    sort: '-publishedAt',
    limit,
    page,
    depth: 1,
  })
  return { docs: result.docs, totalPages: result.totalPages, page: result.page ?? 1 }
}

export async function getPublication(slug: string) {
  const payload = await cms()
  const { docs } = await payload.find({
    collection: 'publications',
    where: { and: [{ status: { equals: 'published' } }, { slug: { equals: slug } }] },
    limit: 1,
    depth: 1,
  })
  return docs[0] ?? null
}

/** Темы, в которых есть опубликованные материалы этого типа, — для ссылок над списком. */
export async function getTopics(kinds: PublicationKind[]) {
  const payload = await cms()
  const topics = await payload.find({
    collection: 'topics',
    where: { status: { equals: 'published' } },
    sort: ['order', 'title'],
    pagination: false,
    depth: 0,
  })
  const counts = await Promise.all(
    topics.docs.map((topic) =>
      payload.count({
        collection: 'publications',
        where: {
          and: [
            { status: { equals: 'published' } },
            { kind: { in: kinds } },
            { theme: { equals: topic.id } },
          ],
        },
      }),
    ),
  )
  return topics.docs
    .filter((_, index) => counts[index].totalDocs > 0)
    .map((topic) => ({ slug: topic.slug, title: topic.title }))
}

/** Соседние материалы того же типа по дате: «предыдущая» старше, «следующая» новее. */
export async function getNeighbors(publication: Publication) {
  if (!publication.publishedAt) return { previous: null, next: null }
  const payload = await cms()
  const base: Where[] = [
    { status: { equals: 'published' } },
    { kind: { equals: publication.kind } },
  ]
  const [older, newer] = await Promise.all([
    payload.find({
      collection: 'publications',
      where: { and: [...base, { publishedAt: { less_than: publication.publishedAt } }] },
      sort: '-publishedAt',
      limit: 1,
      depth: 0,
    }),
    payload.find({
      collection: 'publications',
      where: { and: [...base, { publishedAt: { greater_than: publication.publishedAt } }] },
      sort: 'publishedAt',
      limit: 1,
      depth: 0,
    }),
  ])
  const link = (doc?: Publication) => (doc ? { title: doc.title, href: newsHref(doc.slug) } : null)
  return { previous: link(older.docs[0]), next: link(newer.docs[0]) }
}
