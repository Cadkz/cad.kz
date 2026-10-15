import type { CollectionBeforeValidateHook } from 'payload'
import type { Publication } from '../../../payload-types'
import { freeSlug, slugFromTitle } from '../../domain/slug.mjs'

/**
 * Перед сохранением публикации. Адрес: пустой — из названия; у новой публикации занятый адрес
 * становится свободным («-2», «-3»: две новости с одинаковым названием); у сохранённой занятый
 * адрес — ошибка «значение должно быть уникальным», чтобы не поменять его молча. Дата начала
 * показа: при публикации без даты (создание или перевод из черновика) — сейчас; старые
 * публикации без даты при правке её не получают, чтобы не прыгнуть наверх списка. Работает и
 * для публикаций не из админки (перенос, API).
 */
export const publicationDefaults: CollectionBeforeValidateHook<Publication> = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  if (!data) return data
  const title = data.title ?? originalDoc?.title
  const slug = (data.slug ?? originalDoc?.slug ?? '').trim()
  const taken = async (candidate: string) => {
    const { totalDocs } = await req.payload.count({
      collection: 'publications',
      where: {
        and: [
          { slug: { equals: candidate } },
          ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
        ],
      },
      req,
    })
    return totalDocs > 0
  }
  if (!slug && title) data.slug = await freeSlug(slugFromTitle(title) || 'publikatsiya', taken)
  else if (slug && operation === 'create') data.slug = await freeSlug(slug, taken)
  else if (data.slug != null) data.slug = slug

  const status = data.status ?? originalDoc?.status
  const publishedAt = 'publishedAt' in data ? data.publishedAt : originalDoc?.publishedAt
  const becomesPublished = operation === 'create' || originalDoc?.status !== 'published'
  if (status === 'published' && !publishedAt && becomesPublished)
    data.publishedAt = new Date().toISOString()
  return data
}
