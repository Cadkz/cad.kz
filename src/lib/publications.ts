import type { NewsCardData } from '@/components/NewsCard/NewsCard'
import type { Media, Publication } from '../../payload-types'
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

export function toCard(publication: Publication): NewsCardData {
  return {
    id: publication.id,
    href: newsHref(publication.slug),
    title: publication.title,
    date: publication.publishedAt ? formatDate(publication.publishedAt) : null,
    topic: publication.topic ?? null,
    excerpt: publication.excerpt ?? null,
    cover: cover(publication.cover),
  }
}

/** Опубликованные материалы, новые сверху. */
export async function getPublications({
  kinds = ['news'],
  limit = 12,
  page = 1,
}: {
  kinds?: PublicationKind[]
  limit?: number
  page?: number
} = {}) {
  const payload = await cms()
  const result = await payload.find({
    collection: 'publications',
    where: { and: [{ status: { equals: 'published' } }, { kind: { in: kinds } }] },
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
