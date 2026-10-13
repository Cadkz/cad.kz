import type { Where } from 'payload'
import { cache } from 'react'
import type { NewsCardData } from '@/components/NewsCard/NewsCard'
import type { Media, Publication, Topic } from '../../payload-types'
import { formatDate } from './format'
import { newsHref } from './navigationHrefs'
import { cms } from './payload'

export type PublicationKind = Publication['kind']

type Cover = NonNullable<NewsCardData['cover']>

function cover(value: number | Media | null | undefined): Cover | null {
  if (!value || typeof value === 'number') return null
  if (!value.url || !value.width || !value.height) return null
  return { url: value.url, alt: value.alt, width: value.width, height: value.height }
}

/** Обложки тем для публикаций без своей: id темы → картинки (поле «Обложки…» у темы). */
export type TopicCovers = Map<number, Cover[]>

/** Один запрос на страницу: тем немного, картинки тем берутся сразу с размерами. */
export const getTopicCovers = cache(async (): Promise<TopicCovers> => {
  const payload = await cms()
  const { docs } = await payload.find({
    collection: 'topics',
    pagination: false,
    depth: 1,
  })
  return new Map(
    docs.map((topic) => [
      topic.id,
      (topic.covers ?? []).flatMap((media) => {
        const picture = cover(media)
        // Картинка темы декоративная: смысл карточки несёт заголовок рядом.
        return picture ? [{ ...picture, alt: '' }] : []
      }),
    ]),
  )
})

/**
 * Обложка публикации: своя, иначе одна из обложек темы. Выбор по id публикации — у одной
 * публикации всегда одна и та же картинка, у соседних в списке обычно разные.
 */
export function coverOf(publication: Publication, topicCovers?: TopicCovers): Cover | null {
  const own = cover(publication.cover)
  if (own || !topicCovers) return own
  const theme = publication.theme
  const themeId = typeof theme === 'number' ? theme : theme?.id
  const covers = themeId ? topicCovers.get(themeId) : undefined
  return covers?.length ? (covers[publication.id % covers.length] ?? null) : null
}

/** Тема публикации из связи (при depth ≥ 1), прежнее текстовое поле — запасной вариант. */
export function themeOf(publication: Publication): { slug: string | null; title: string } | null {
  const theme = publication.theme
  if (theme && typeof theme === 'object') return { slug: (theme as Topic).slug, title: theme.title }
  return publication.topic ? { slug: null, title: publication.topic } : null
}

export function toCard(publication: Publication, topicCovers?: TopicCovers): NewsCardData {
  return {
    id: publication.id,
    href: newsHref(publication.slug),
    title: publication.title,
    date: publication.publishedAt ? formatDate(publication.publishedAt) : null,
    topic: themeOf(publication)?.title ?? null,
    excerpt: publication.excerpt ?? null,
    cover: coverOf(publication, topicCovers),
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

/** Сколько дней акция без даты окончания считается свежей для главной. */
const PROMO_FRESH_DAYS = 180

/**
 * Действующие акции для главной: дата «действует до» не прошла, а если её нет — опубликована
 * не раньше полугода назад. Прошедшие остаются в списке акций, но на главной не висят.
 */
export async function getCurrentPromotions(limit: number) {
  const payload = await cms()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const fresh = new Date(now.getTime() - PROMO_FRESH_DAYS * 86_400_000).toISOString()
  const { docs } = await payload.find({
    collection: 'publications',
    where: {
      and: [
        { status: { equals: 'published' } },
        { kind: { equals: 'promotion' } },
        {
          or: [
            { endsAt: { greater_than_equal: today } },
            {
              and: [
                { endsAt: { exists: false } },
                {
                  or: [
                    { publishedAt: { greater_than_equal: fresh } },
                    { publishedAt: { exists: false } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    sort: '-publishedAt',
    limit,
    depth: 1,
  })
  return docs
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
